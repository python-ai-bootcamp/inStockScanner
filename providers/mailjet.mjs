import Mailjet from 'node-mailjet';
import { readFileSync } from 'fs';

const mailCredentials = JSON.parse(readFileSync(new URL('../configuration/.malijet_api_key.json', import.meta.url)));

const mailjet = Mailjet.apiConnect(
    mailCredentials.key,
    mailCredentials.secret
);

export async function sendNotification({ logger, recipients, sender, subject, htmlPart, textPart }) {
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: sender,
                    To: recipients,
                    Subject: subject,
                    TextPart: textPart,
                    HTMLPart: htmlPart
                }
            ]
        });

    try {
        const result = await request;
        logger("SUCCESS SENDING MAIL");
        logger(result.body);
    } catch (err) {
        logger("ERRROR SENDING MAIL");
        logger(err.statusCode);
    }
}
