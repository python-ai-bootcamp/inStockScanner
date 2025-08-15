import mjs from 'whatsapp-web.js';
const { Client, LocalAuth  } = mjs;
import qrcode from 'qrcode-terminal';

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

export function initialize({ key, browser }) {
  return new Promise((resolve, reject) => {
    console.log('Initializing WhatsApp Web JS client...');
    // Use phone number as a unique ID to support multiple sessions
    const clientId = key.phone.split('@')[0];
    client = new Client({
        puppeteer: {
            browserWSEndpoint: browser.wsEndpoint()
        },
        authStrategy: new LocalAuth({
            clientId: clientId,
            dataPath: './configuration/whatsapp-web.js.cache'
        })
    });

    client.once('ready', () => {
        console.log('WhatsApp Web JS client is ready!');
        resolve();
    });

    client.on('qr', qr => {
        console.log('QR code received, please scan:');
        qrcode.generate(qr, { small: true });
    });

    client.once('auth_failure', (msg) => {
        console.error('WhatsApp Web JS authentication failure:', msg);
        reject(new Error('Authentication failure'));
    });

    client.once('disconnected', (reason) => {
        console.log('WhatsApp Web JS client was disconnected:', reason);
        reject(new Error('Client disconnected'));
    });

    client.initialize().catch(err => {
      console.error('Failed to initialize WhatsApp Web JS client:', err);
      reject(err)
    });

    console.log("WhatsApp Web JS client initialization process started.");
  });
}

