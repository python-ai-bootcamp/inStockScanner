import baileys from '@whiskeysockets/baileys';
const { DisconnectReason, useMultiFileAuthState } = baileys;
import qrcode from 'qrcode-terminal';
import path from 'path';

let sock;
let authState;

export async function initialize({ key, logger }) {
  const clientId = key.phone.split('@')[0];
  const authFile = path.join('sessions', `baileys-${clientId}.json`);
  const { state, saveCreds } = await useMultiFileAuthState(authFile);
  authState = state;

  sock = baileys.default({
    auth: authState,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve, reject) => {
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        logger('QR code received, please scan:');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
        if (shouldReconnect) {
          initialize({ key, logger });
        } else {
          reject(new Error('Connection closed. You are logged out.'));
        }
      } else if (connection === 'open') {
        logger('WhatsApp client is ready!');
        resolve();
      }
    });
  });
}

export async function sendNotification({ logger, recipients, textContent }) {
  logger(`Sending WhatsApp notification to: ${recipients.map(r => r.phoneNumber).join(', ')}`);
  for (const recipient of recipients) {
    try {
      const jid = recipient.phoneNumber.includes('@') ? recipient.phoneNumber : `${recipient.phoneNumber}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: textContent });
      logger(`Successfully sent WhatsApp message to ${recipient.phoneNumber}`);
    } catch (error) {
      logger(`Failed to send WhatsApp message to ${recipient.phoneNumber}:`, error);
    }
  }
}

export async function disconnect({ logger }) {
  if (sock) {
    try {
      await sock.logout();
      sock = null;
      logger('Baileys client disconnected and logged out.');
    } catch(err) {
      logger('Failed to disconnect Baileys client:', err);
      throw err;
    }
  }
}
