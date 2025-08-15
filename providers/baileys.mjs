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
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve, reject) => {
    const connectionUpdateListener = (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        logger('QR code received, please scan:');
        qrcode.generate(qr, { small: true });
      }
      if (connection === 'open') {
        logger('WhatsApp client is ready!');
        sock.ev.removeListener('connection.update', connectionUpdateListener);
        resolve();
      } else if (connection === 'close') {
        const isLoggedOut = (lastDisconnect.error)?.output?.statusCode === DisconnectReason.loggedOut;
        if (isLoggedOut) {
          logger('Connection closed: Logged out. Please re-scan the QR code.');
          sock.ev.removeListener('connection.update', connectionUpdateListener);
          reject(new Error('Logged out'));
        } else {
            logger(`Connection closed due to ${lastDisconnect.error}, waiting for automatic reconnect...`);
        }
      }
    };
    sock.ev.on('connection.update', connectionUpdateListener);
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
      sock.end();
      if (sock.ws && sock.ws.close) {
        sock.ws.close();
      }
      sock = null;
      logger('Baileys client disconnected.');
    } catch(err) {
      logger('Failed to disconnect Baileys client:', err);
      throw err;
    }
  }
}
