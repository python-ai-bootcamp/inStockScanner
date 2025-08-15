import puppeteer, { executablePath } from 'puppeteer';
import { createHash } from 'crypto';
import { readFileSync, appendFileSync, writeFileSync} from 'fs';
import { resolve } from 'path';
import path from 'path';

const refractoryPeriodsPath = new URL('./configuration/refractoryPeriods.json', import.meta.url);

if (process.argv.includes('--invalidate-refractory-periods')) {
  writeFileSync(refractoryPeriodsPath, '{}');
}

let refractoryPeriods = {};
const current_timestamp=Date.now()
try {
  refractoryPeriods = JSON.parse(readFileSync(refractoryPeriodsPath, 'utf-8'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err; // rethrow other errors
}


function hashIdGen(validationObject) {
  return createHash('sha256').update(`${validationObject.url}_${validationObject.xpath}_${validationObject.successCondition}_${validationObject.refractoryPeriod_hour}`).digest('hex');
}

const validations = JSON.parse(readFileSync('./configuration/validations.json', 'utf-8'))
                        .filter(x=>x.enabled)
                        .map(x=>Object.assign(x, {hash_id:hashIdGen(x)}));
const notificationProviders = JSON.parse(readFileSync('./configuration/notificationProviders.json', 'utf-8'));

const logPath = './main.log';
appendFileSync(logPath, `[${new Date().toISOString()}] Current dir: ${process.cwd()}\n`);
function str(val) {
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val, null, 2);
  } catch (e) {
    return String(val); // fallback for circular refs
  }
}

function logger(logLine) {
  const line = `[${new Date().toISOString()}]:: ${str(logLine)}\n`;
  appendFileSync(logPath, line);
  console.log(logLine);
}

logger(validations);

for (const providerConfig of notificationProviders.filter(x=>x.enabled)) {
  try{
    const providerPath = new URL(`./providers/${providerConfig.provider}`, import.meta.url);
    const notificationProvider = await import(providerPath.href);
    await notificationProvider.initialize({
      key: providerConfig.key,
      logger
    });
    logger(`initialization executed for ${providerConfig.provider}`)
  } catch (error) {
    logger(`!!! CRITICAL ERROR in initializing for ${providerConfig.provider} provider !!!`);
    logger(error.stack || error);
  }
}

const scanProducts = async function(){
  logger("scanProducts:: entered");
  let browser;
  try {
    const urlMaxLength=Math.max(...(validations.map(x=>x.url).map(x=>x.length)));
    const userDataDir = resolve(process.cwd(), '.puppeteer_cache');
    logger(`Puppeteer will use user data directory: ${userDataDir}`);
    const execPath = executablePath();
    logger(`Puppeteer will use executable path: ${execPath}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userDataDir: userDataDir,
      executablePath: execPath
    });
    const page = await browser.newPage();
    const inStockResults=[]

    for (const validation of validations) {
      logger(`scanProducts:: starting to process ${JSON.stringify(validation)}`);
      await page.goto(validation.url, {
        waitUntil: 'domcontentloaded',
      });
      logger(`scanProducts:: page loaded`);
      const xpath = validation.xpath;
      const result = await page.evaluate((xpath) => {
        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        const nodes = [];
        let node = iterator.iterateNext();
        while (node) {
          nodes.push(node.textContent);
          node = iterator.iterateNext();
        }
        return nodes.length;
      }, xpath);
      const isSuccess=eval(`${result}${validation.successCondition}`)
      logger(`${validation.url.padEnd(urlMaxLength,' ')} -> ${isSuccess ? 'inStock' : 'missing'}`);
      if(isSuccess){
        if(!(refractoryPeriods[hashIdGen(validation)]) || (refractoryPeriods[hashIdGen(validation)]<current_timestamp)){
          logger('did not detect any refractory period, or current_timestamp has already exceeded the existing one, adding to product to inStockResults')
          inStockResults.push(validation.url)
          if(!(refractoryPeriods[hashIdGen(validation)])){
            logger('product did not have refractoryPeriod, adding a new one')
            refractoryPeriods[hashIdGen(validation)]=current_timestamp+validation.refractoryPeriod_hour*3600*1000
            writeFileSync('./configuration/refractoryPeriods.json', JSON.stringify(refractoryPeriods, null, 2))
          }
        }else{
          logger('current_timestamp has not exceeded the existing refractory period, not adding product inStockResults')
        }
      }
    }
    return inStockResults;
  } catch (error) {
    logger("!!! CRITICAL ERROR in scanProducts !!!");
    logger(error.stack || error);
    return []; // Return an empty array on error
  } finally {
    if (browser) {
      await browser.close();
      logger("Browser closed in finally block.");
    }
  }
}

let results=await scanProducts();
logger({message: "scan results", results});

if (results.length > 0) {
  const subject = "The Hishook Results You Requested Were Found";
  const textContent = `Daily monitored products on hahishook.com found inStock:\n${results.map(x=>x.split('/').filter(Boolean).pop()+"-->"+x+"\n")}`;
  const structuredContent = `<h3>Daily monitored products on hahishook.com found inStock:</h3><br/><ul>${results.map(x=>'<li>'+'<a href="'+x+'">'+x.split('/').filter(Boolean).pop()+'</a></li>')}</ul>`;

  for (const providerConfig of notificationProviders.filter(x=>x.enabled)) {
    logger(`sending notification for ${providerConfig.provider}`)
    try{
      const providerPath = new URL(`./providers/${providerConfig.provider}`, import.meta.url);
      const notificationProvider = await import(providerPath.href);
      await notificationProvider.sendNotification({
        logger,
        recipients: providerConfig.recipients,
        sender: providerConfig.sender,
        subject,
        structuredContent,
        textContent,
        key: providerConfig.key
      });
      logger(`notification sent for ${providerConfig.provider}`);
      await notificationProvider.disconnect();
      logger(`disconnected from ${providerConfig.provider}`);
    } catch (error) {
      logger("!!! CRITICAL ERROR in sending mail for ${providerConfig.provider} provider !!!");
      logger(error.stack || error);
    }
  }
} else {
  logger("No results found, skipping notifications");
}