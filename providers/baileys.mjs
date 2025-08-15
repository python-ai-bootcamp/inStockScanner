import baileys from '@whiskeysockets/baileys';
const { DisconnectReason, useMultiFileAuthState } = baileys;
import qrcode from 'qrcode-terminal';
import path from 'path';

let sock;
let authState;

export async function initialize({ key, logger }) {
    let connected = false;
    while(!connected) {
        try {
            const connectionPromise = new Promise(async (resolve, reject) => {
                const clientId = key.phone.split('@')[0];
                const authFile = path.join('sessions', `baileys-${clientId}.json`);
                const { state, saveCreds } = await useMultiFileAuthState(authFile);

                sock = baileys.default({ auth: state });
                sock.ev.on('creds.update', saveCreds);

                const connectionUpdateListener = (update) => {
                    const { connection, lastDisconnect, qr } = update;
                    if (qr) {
                        logger('QR code received, please scan:');
                        qrcode.generate(qr, { small: true });
                    }
                    if (connection === 'open') {
                        sock.ev.removeListener('connection.update', connectionUpdateListener);
                        resolve(true); // Resolve with success
                    } else if (connection === 'close') {
                        sock.ev.removeListener('connection.update', connectionUpdateListener);
                        const statusCode = (lastDisconnect.error)?.output?.statusCode;
                        logger(`Connection closed due to ${lastDisconnect.error}`);
                        if (statusCode === DisconnectReason.loggedOut) {
                            reject(new Error('Logged out')); // This is a fatal error
                        } else {
                            resolve(false); // Not fatal, signal a retry
                        }
                    }
                };
                sock.ev.on('connection.update', connectionUpdateListener);
            });

            const attemptResult = await connectionPromise;
            if (attemptResult === true) {
                connected = true; // Success! Break the loop.
                logger('WhatsApp client is ready!');
            } else {
                logger('Connection attempt failed, will retry...');
            }
        } catch (error) {
            logger(`Fatal error during connection: ${error.message}. Stopping.`);
            throw error; // Rethrow to be caught by main.mjs
        }
    }
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
