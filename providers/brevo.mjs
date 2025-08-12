import Mailjet from 'node-mailjet';
import brevo_python
from brevo_python.rest import ApiException

export async function sendNotification({ logger, recipients, sender, subject, structuredContent, textContent, key }) {
  configuration = brevo_python.Configuration()
  configuration.api_key['api-key'] = key
  api_instance = brevo_python.TransactionalEmailsApi(brevo_python.ApiClient(configuration))
  send_smtp_email = brevo_python.SendSmtpEmail({
      sender,
      to=recipients,
      subject,
      html_content=structuredContent,
      text_content=textContent
  })
}
