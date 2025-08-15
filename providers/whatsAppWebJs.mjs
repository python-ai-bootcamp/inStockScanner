import mjs from 'whatsapp-web.js';
const { Client, LocalAuth  } = mjs;
import qrcode from 'qrcode-terminal';
import { executablePath } from 'puppeteer';
import { resolve } from 'path';

let client;

export async function sendNotification({ logger, recipients, textContent }) {
    logger(`Sending WhatsApp notification to: ${recipients.map(r => r.phoneNumber).join(', ')}`);
    for (const recipient of recipients) {
        try {
            await client.sendMessage(recipient.phoneNumber, textContent);
            logger(`Successfully sent WhatsApp message to ${recipient.phoneNumber}`);
        } catch (error) {
            logger({
                message: `Failed to send WhatsApp message to ${recipient.phoneNumber}`,
                error
            });
        }
    }
    // Add a delay to ensure message is sent before client disconnects.
    logger('Waiting 5 seconds to allow message to be sent...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    logger('Delay finished.');
}

export function initialize({ key, logger, browserWSEndpoint }) {
  return new Promise((resolve, reject) => {
    logger('Initializing WhatsApp Web JS client...');
    // Use phone number as a unique ID to support multiple sessions
    const clientId = key.phone.split('@')[0];
    const userDataDir = resolve(process.cwd(), '.puppeteer_whatsapp_cache');
    const execPath = executablePath();

    const puppeteerOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: execPath,
        userDataDir: userDataDir
    };

    if (browserWSEndpoint) {
        logger(`Connecting to existing browser at ${browserWSEndpoint}`);
        puppeteerOptions.browserWSEndpoint = browserWSEndpoint;
    }

    client = new Client({
        puppeteer: puppeteerOptions,
        authStrategy: new LocalAuth({
            clientId: clientId,
            dataPath: './configuration/whatsapp-web.js.cache'
        })
    });

    client.once('ready', () => {
        logger('WhatsApp Web JS client is ready!');
        resolve();
    });

    client.on('qr', qr => {
        logger('QR code received, please scan:');
        qrcode.generate(qr, { small: true });
    });

    client.once('auth_failure', (msg) => {
        logger(`WhatsApp Web JS authentication failure: ${msg}`);
        reject(new Error('Authentication failure'));
    });

    client.once('disconnected', (reason) => {
        logger(`WhatsApp Web JS client was disconnected: ${reason}`);
        reject(new Error('Client disconnected'));
    });

    client.initialize().catch(err => {
      logger({
          message: 'Failed to initialize WhatsApp Web JS client',
          error: err
      });
      reject(err)
    });

    logger("WhatsApp Web JS client initialization process started.");
  });
}

export async function disconnect({logger}) {
  if (client) {
    await client.destroy();
    client = null;
    logger('WhatsApp Web JS client disconnected and destroyed.');
  }
}
