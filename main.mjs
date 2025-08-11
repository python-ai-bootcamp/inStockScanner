import puppeteer from 'puppeteer';
import Mailjet from 'node-mailjet';
import { createHash } from 'crypto';
import { readFileSync, appendFileSync, writeFileSync} from 'fs';
import { resolve } from 'path';

function hashIdGen(validationObject) {
  return createHash('sha256').update(`${validationObject.url}_${validationObject.xpath}_${validationObject.successCondition}_${validationObject.refactoryPeriod_hour}`).digest('hex');
}

const rawValidations = readFileSync(new URL('./configuration/validations.json', import.meta.url), 'utf-8');
const validations = JSON.parse(rawValidations).filter(x=>x.enabled).map(x=>Object.assign(x, {hash_id:hashIdGen(x)}));

const rawMailRecipients = readFileSync(new URL('./configuration/mailRecipients.json', import.meta.url), 'utf-8');
const mailRecipients = JSON.parse(rawMailRecipients);

const rawMailSender = readFileSync(new URL('./configuration/mailSender.json', import.meta.url), 'utf-8');
const mailSender = JSON.parse(rawMailSender);

const logPath = './log.txt';
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

const mailCredentials=JSON.parse(readFileSync("./configuration/.malijet_api_key.json"))

const mailjet = Mailjet.apiConnect(
    mailCredentials.key,
    mailCredentials.secret
);

const sendMail=function(inStockProducts){
  if(inStockProducts.length>0){
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: mailSender,
              To: mailRecipients,
              Subject: "The Hishook Results You Requested Were Found",
              TextPart: `Daily monitored products on hahishook.com found inStock:\n${inStockProducts.map(x=>x.split('/').filter(Boolean).pop()+"-->"+x+"\n")}`,
              HTMLPart: `<h3>Daily monitored products on hahishook.com found inStock:</h3><br/><ul>${inStockProducts.map(x=>'<li>'+'<a href="'+x+'">'+x.split('/').filter(Boolean).pop()+'</a></li>')}</ul>`
            }
          ]
        })

    request
      .then((result) => {
          logger("SUCCESS SENDING MAIL")
          logger(result.body)
      })
      .catch((err) => {
          logger("ERRROR SENDING MAIL")
          logger(err.statusCode)
      })
  }else{
    logger("No results found, skipping mail")
  }
}

const scanProducts = async function(){
  logger("scanProducts:: entered");
  const urlMaxLength=Math.max(...(validations.map(x=>x.url).map(x=>x.length)));
  const userDataDir = resolve(process.cwd(), '.puppeteer_cache');
  logger(`Puppeteer will use user data directory: ${userDataDir}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    userDataDir: userDataDir
  });
  const page = await browser.newPage();
  const inStockResults=[]
  
  let refactoryPeriods = {};
  const current_timestamp=Date.now()
  try {
    refactoryPeriods = JSON.parse(readFileSync(new URL('./configuration/refactoryPeriods.json', import.meta.url), 'utf-8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err; // rethrow other errors
  }
  
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
      if(!(refactoryPeriods[hashIdGen(validation)]) || (refactoryPeriods[hashIdGen(validation)]<current_timestamp)){
        logger('did not detect any refactory period, or current_timestamp has already exceeded the existing one, adding to product to inStockResults')
        inStockResults.push(validation.url)
        if(!(refactoryPeriods[hashIdGen(validation)])){
          logger('product did not have refactoryPeriod, adding a new one')
          refactoryPeriods[hashIdGen(validation)]=current_timestamp+validation.refactoryPeriod_hour*3600*1000
          writeFileSync('./configuration/refactoryPeriods.json', JSON.stringify(refactoryPeriods, null, 2))
        }
      }else{
        logger('current_timestamp has not exceeded the existing refactory period, not adding product inStockResults')
      }
    }
  }

  await browser.close();
  return inStockResults
}

let results=await scanProducts();
logger("results:\n",results);

sendMail(results);