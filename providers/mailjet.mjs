import Mailjet from 'node-mailjet';
import { readFileSync } from 'fs';

export async function sendNotification({ logger, recipients, sender, subject, structuredContent, textContent, key }) {
    const mailjet = Mailjet.apiConnect(
        key.key,
        key.secret
    );
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: sender,
                    To: recipients,
                    Subject: subject,
                    TextPart: textContent,
                    HTMLPart: structuredContent
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
