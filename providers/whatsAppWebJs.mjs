import mjs from 'whatsapp-web.js';
const { Client, LocalAuth  } = mjs;
import qrcode from 'qrcode-terminal';

let client;

export async function sendNotification({ logger, recipients, sender, subject, structuredContent, textContent, key }) {
    for (const recipient of recipients){
      client.sendMessage(recipient.phoneNumber, textContent);
    }
}

export async function initialize({key}) {
  response=Promise()
  // Create a new client instance
  client = new Client({
      puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
      authStrategy: new LocalAuth({
          dataPath: './configuration/whatsapp-web.js.cache'
      })
  });

  // When the client is ready, run this code (only once)
  client.once('ready', () => {
      console.log('Client is ready!');
      response.resolve()
  });

  // When the client received QR-Code
  client.on('qr', qr => {
      qrcode.generate(qr, {small: true});
  });


  // Start your client
  console.log("before init client")
  client.initialize();
  console.log("after init client")
  return response
}

export async function disconnect() {
  // Brevo provider does not need any disconnect step
  return;
}
