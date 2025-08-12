import { appendFileSync } from 'fs';
import { resolve } from 'path';

export async function sendNotification({ logger, recipients, subject, textContent }) {
    logger('logfile.mjs::sendNotification - Entered');
    try {
        const logMessage = `
--------------------------------------------------
${new Date().toISOString()}
Subject: ${subject}
Content: ${textContent}
--------------------------------------------------
`;
        for (const recipient of recipients) {
            const filePath = resolve(recipient.filename);
            appendFileSync(filePath, logMessage);
            logger(`Notification written to ${filePath}`);
        }
    } catch (error) {
        logger('logfile.mjs::sendNotification - ERROR');
        logger(error);
    }
}
