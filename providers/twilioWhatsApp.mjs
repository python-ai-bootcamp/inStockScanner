import twilio from 'twilio';

export async function sendNotification({ logger, recipients, sender, textContent, key }) {
    const client = twilio(key.sid, key.token);

    let fromNumber = String(sender);
    if (!fromNumber.startsWith('+')) {
        fromNumber = `+${fromNumber}`;
    }

    for (const recipient of recipients) {
        try {
            const messageObject={
                from: `whatsapp:${fromNumber}`,
                body: textContent,
                to: `whatsapp:${recipient.phoneNumber}`
            }
            logger(`about to send ::\n${JSON.stringify(messageObject,null,"\t")}`)
            const message = await client.messages.create(messageObject);
            logger(`SUCCESS SENDING WHATSAPP to ${recipient.phoneNumber}`);
            logger(message.sid);
        } catch (error) {
            logger(`ERROR SENDING WHATSAPP to ${recipient.phoneNumber}`);
            logger(error);
        }
    }
}
