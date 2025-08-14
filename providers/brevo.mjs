import * as brevo from '@getbrevo/brevo';

export async function sendNotification({ logger, recipients, sender, subject, structuredContent, textContent, key }) {
    const apiInstance = new brevo.TransactionalEmailsApi();

    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, key);

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = structuredContent;
    sendSmtpEmail.textContent = textContent;
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = recipients;

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        logger("SUCCESS SENDING MAIL");
        logger(data);
    } catch (error) {
        logger("ERROR SENDING MAIL");
        logger(error);
    }
}

export async function authenticate({key}) {
  // Brevo provider does not need any authentication step
  // This is a placeholder for future providers that might need it
  return;
}
