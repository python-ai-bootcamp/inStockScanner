# Website Stock Item Availability Checker

A Node.js-based web scraper that automatically checks a list of websites for product availability and sends notifications through various channels when a product is back in stock.

## Features

*   **Configurable Product Checks:** Easily configure which products to check via a simple JSON file.
*   **Multiple Notification Providers:** Send notifications through different channels like email, log files, or your own custom providers.
*   **Enable/Disable Providers:** Easily enable or disable notification providers from the configuration file.
*   **Refractory Period:** Avoids spamming notifications by implementing a "refractory period" for each product, preventing repeated notifications for a set amount of time.
*   **Customizable Success Conditions:** Define what "in stock" means for each product using XPath expressions and success conditions.
*   **Automated Scheduling:** Includes scripts for easy setup of scheduled tasks on both Windows and Linux.
*   **Uninstallation Scripts:** Includes scripts to easily remove the scheduled tasks.
*   **Extensible:** Designed to be easily extended with new notification providers and validators.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or higher recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1.  Clone the repository or download the source code.
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Configuration

All configuration files must be placed in the `configuration/` directory.

### `notificationProviders.json`

This file contains an array of notification providers to use. This allows for sending notifications through multiple channels. Each object in the array represents a provider and has an `enabled` flag to easily turn it on or off.

**Example `notificationProviders.json`:**

This file should contain a single JSON array. You can include and combine configurations for any of the supported providers within this array. Below is an example showing all providers configured together.

```json
[
  {
    "enabled": true,
    "provider": "mailjet.mjs",
    "key": { "key": "YOUR_MAILJET_API_KEY", "secret": "YOUR_MAILJET_API_SECRET" },
    "recipients": [{ "Email": "recipient@example.com", "Name": "Recipient" }],
    "sender": { "Email": "sender@example.com", "Name": "Availability Checker" }
  },
  {
    "enabled": true,
    "provider": "brevo.mjs",
    "key": "YOUR_BREVO_API_KEY",
    "recipients": [{ "email": "recipient@example.com", "name": "Recipient" }],
    "sender": { "email": "sender@example.com", "name": "Availability Checker" }
  },
  {
    "enabled": false,
    "provider": "whatsAppTwilio.mjs",
    "key": { "accountSid": "YOUR_TWILIO_ACCOUNT_SID", "authToken": "YOUR_TWILIO_AUTH_TOKEN" },
    "recipients": [{ "to": "whatsapp:+15551234567" }],
    "sender": { "from": "whatsapp:+14155238886" }
  },
  {
    "enabled": false,
    "provider": "whatsAppWebJs.mjs",
    "key": { "phone": "YOUR_PHONE_NUMBER_WITH_COUNTRY_CODE" },
    "recipients": [{ "phoneNumber": "RECIPIENT_PHONE_NUMBER_WITH_COUNTRY_CODE" }]
  },
  {
    "enabled": false,
    "provider": "whatsAppBaileys.mjs",
    "key": { "phone": "YOUR_PHONE_NUMBER_WITH_COUNTRY_CODE" },
    "recipients": [{ "phoneNumber": "RECIPIENT_PHONE_NUMBER_WITH_COUNTRY_CODE" }]
  },
  {
    "enabled": true,
    "provider": "logfile.mjs",
    "recipients": [{ "filename": "./notifications.log" }]
  }
]
```

**Note on `whatsAppWebJs.mjs`:** The first time you run the application with this provider enabled, you will need to scan a QR code in your terminal to log in to WhatsApp Web. A session file will be created in `configuration/.puppeteer_cache` to keep you logged in.

### `validations.json`

This file contains an array of products to monitor.

*   `url`: The URL of the product page.
*   `xpath`: An XPath expression to select an element on the page.
*   `successCondition`: A JavaScript condition that evaluates to `true` when the product is in stock.
*   `enabled`: Set to `true` to enable the check for this product.
*   `refactoryPeriod_hour`: The number of hours to wait before sending another notification.

**Example:**
```json
[
  {
    "url": "https://example.com/product/some-product",
    "xpath": "//div[contains(text(), 'Out of Stock')]",
    "successCondition": "==0",
    "enabled": true,
    "refactoryPeriod_hour": 168
  }
]
```

## Usage

### Running the Checker

To run the script manually:
```bash
node main.mjs
```

### Invalidating Refractory Periods

To reset the refractory period for all products, run the script with the `--invalidate-refractory-periods` flag:
```bash
node main.mjs --invalidate-refractory-periods
```

## Scheduling and Uninstallation

### Windows

**Installation:**
1.  Open PowerShell with **Administrator privileges**.
2.  Navigate to the project's root directory.
3.  Run the installation script: `.\install-task.ps1`

**Uninstallation:**
1.  Open PowerShell with **Administrator privileges**.
2.  Navigate to the project's root directory.
3.  Run the uninstallation script: `.\uninstall-task.ps1`

### Linux

**Installation:**
1.  Open your terminal.
2.  Navigate to the project's root directory.
3.  Make the installation script executable: `chmod +x install-task.sh`
4.  Run the script: `./install-task.sh`

**Uninstallation:**
1.  Open your terminal.
2.  Navigate to the project's root directory.
3.  Run the script: `./uninstall-task.sh`

## Extensibility

This tool is designed to be highly extensible, allowing you to easily add your own notification providers and validation logic.

### Creating a Custom Notification Provider

To create a new notification provider, you need to create a new `.mjs` file in the `providers/` directory. This file must export three async functions: `initialize`, `sendNotification`, and `disconnect`.

1.  **`initialize(params)`**: This function is called once when the application starts. It's the place to perform any setup for your provider, such as authentication or connecting to a service. It receives an object with `logger` and `key` properties.

2.  **`sendNotification(params)`**: This function is called when a notification needs to be sent. It receives an object containing the notification details, such as `recipients`, `subject`, and `textContent`.

3.  **`disconnect(params)`**: This function is called when the application is about to exit. It's the place to perform any cleanup tasks, like logging out or closing a connection. It receives a `logger` object.

**Template:**
```javascript
// providers/my-custom-provider.mjs

/**
 * Initializes the provider.
 * @param {object} params - The parameters.
 * @param {function} params.logger - The logger instance.
 * @param {object} params.key - The key from the provider's configuration.
 */
export async function initialize({ logger, key }) {
  logger('MyCustomProvider::initialize - Entered');
  try {
    // Your initialization logic here (e.g., authentication)
    logger('MyCustomProvider::initialize - Success');
  } catch (error) {
    logger('MyCustomProvider::initialize - ERROR');
    logger(error);
  }
}

/**
 * Sends a notification.
 * @param {object} params - The parameters.
 * @param {function} params.logger - The logger instance.
 * @param {array} params.recipients - The recipients from the provider's configuration.
 * @param {object} params.sender - The sender from the provider's configuration.
 * @param {string} params.subject - The notification subject.
 * @param {string} params.textContent - The plain text content of the notification.
 * @param {string} params.structuredContent - The HTML content of the notification.
 * @param {object} params.key - The key from the provider's configuration.
 */
export async function sendNotification({ logger, recipients, sender, subject, textContent, structuredContent, key }) {
  logger('MyCustomProvider::sendNotification - Entered');
  try {
    // Your notification logic here
    logger('MyCustomProvider::sendNotification - Success');
  } catch (error) {
    logger('MyCustomProvider::sendNotification - ERROR');
    logger(error);
  }
}

/**
 * Disconnects the provider.
 * @param {object} params - The parameters.
 * @param {function} params.logger - The logger instance.
 */
export async function disconnect({ logger }) {
  logger('MyCustomProvider::disconnect - Entered');
  try {
    // Your disconnection logic here (e.g., logging out)
    logger('MyCustomProvider::disconnect - Success');
  } catch (error) {
    logger('MyCustomProvider::disconnect - ERROR');
    logger(error);
  }
}
```

After creating your provider, you need to configure it in `configuration/notificationProviders.json`.

### Creating a Custom Validator

The validation system is inherently extensible through the `configuration/validations.json` file. You can create a new validator by simply adding a new object to the array in this file. Each validator object has several key fields:

*   `url`: The full URL of the product page to check.
*   `xpath`: An XPath expression used to find a specific element on the page. You can use your browser's developer tools to find the XPath of the element you want to check (e.g., an "out of stock" message).
*   `successCondition`: A JavaScript expression that is evaluated against the number of nodes found by the `xpath`. This is what determines if the product is "in stock". For example:
    *   `==0`: Success if the element is *not* found (e.g., the "out of stock" message is missing).
    *   `>0`: Success if the element *is* found (e.g., an "add to cart" button is present).
*   `enabled`: A boolean (`true` or `false`) that allows you to easily enable or disable checking for this specific product without removing it from the configuration.
*   `refactoryPeriod_hour`: An integer representing the number of hours the script will wait before sending another notification for this product after a successful check. This prevents spam.

By combining these fields, you can create a highly specific and customized validator for almost any website.
