import mjs from 'whatsapp-web.js';
const { Client, LocalAuth  } = mjs;
import qrcode from 'qrcode-terminal';
import path from 'path';
import { executablePath } from 'puppeteer';

let client;

export async function sendNotification({ logger, recipients, textContent }) {
    logger(`Sending WhatsApp notification to: ${recipients.map(r => r.phoneNumber).join(', ')}`);
    for (const recipient of recipients) {
        try {
            await client.sendMessage(recipient.phoneNumber, textContent);
            logger(`Successfully sent WhatsApp message to ${recipient.phoneNumber}`);
        } catch (error) {
            logger(`Failed to send WhatsApp message to ${recipient.phoneNumber}:`, error);
        }
    }
    // Add a delay to ensure message is sent before client disconnects.
    logger('Waiting 5 seconds to allow message to be sent...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    logger('Delay finished.');
}

export function initialize({ key, logger }) {
  return new Promise((resolve, reject) => {
    try {
      logger('Initializing WhatsApp Web JS client...');
      // Use phone number as a unique ID to support multiple sessions
      const clientId = key.phone.split('@')[0];
      //const userDataDir = path.resolve('./configuration/whatsapp-web.js.cache');
      client = new Client({
          puppeteer: {
              executablePath: executablePath(),
              //userDataDir: userDataDir,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
          authStrategy: new LocalAuth({
              clientId: clientId//,
              //dataPath: userDataDir
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
          const err = new Error(msg);
          logger('WhatsApp Web JS authentication failure:', err);
          reject(err);
      });

      client.once('disconnected', (reason) => {
          const err = new Error(reason);
          logger('WhatsApp Web JS client was disconnected:', err);
          reject(err);
      });

      (async () => {
        try {
          await client.initialize();
        } catch (err) {
          logger('Failed to initialize WhatsApp Web JS client:', err);
          reject(err);
        }
      })();

      logger("WhatsApp Web JS client initialization process started.");
    } catch (err) {
      logger('An unexpected error occurred during WhatsApp Web JS client initialization:', err);
      reject(err);
    }
  });
}

export async function disconnect({logger}) {
  if (client) {
    try {
      await client.destroy();
      client = null;
      logger('WhatsApp Web JS client disconnected and destroyed.');
    } catch(err) {
      logger('Failed to disconnect WhatsApp Web JS client:', err);
      throw err;
    }
  }
}
