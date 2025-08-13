# Website Availability Checker

A Node.js-based web scraper that automatically checks a list of websites for product availability and sends notifications through various channels when a product is back in stock.

## Features

*   **Configurable Product Checks:** Easily configure which products to check via a simple JSON file.
*   **Multiple Notification Providers:** Send notifications through different channels like email, log files, or your own custom providers.
*   **Enable/Disable Providers:** Easily enable or disable notification providers from the configuration file.
*   **Refractory Period:** Avoids spamming notifications by implementing a "refractory period" for each product, preventing repeated notifications for a set amount of time.
*   **Invalidate Refractory Periods:** A command-line flag allows you to reset the refractory periods for all products.
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

**Example:**
```json
[
  {
    "enabled": true,
    "provider": "mailjet.mjs",
    "key": { "key": "YOUR_API_KEY", "secret": "YOUR_SECRET" },
    "recipients": [{ "Email": "recipient@example.com", "Name": "Recipient" }],
    "sender": { "Email": "sender@example.com", "Name": "Availability Checker" }
  },
  {
    "enabled": false,
    "provider": "logfile.mjs",
    "recipients": [{ "filename": "./notifications.log" }]
  }
]
```

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

To create a new notification provider, you need to:

1.  Create a new `.mjs` file in the `providers/` directory.
2.  This file must export an async function named `sendNotification`.
3.  The `sendNotification` function will receive an object with the following properties:
    *   `logger`: The logger instance.
    *   `recipients`: The `recipients` array from your provider's configuration.
    *   `sender`: The `sender` object from your provider's configuration.
    *   `subject`: The notification subject line.
    *   `structuredContent`: The HTML content of the notification.
    *   `textContent`: The plain text content of the notification.
    *   `key`: The `key` object from your provider's configuration.

**Template:**
```javascript
// providers/my-custom-provider.mjs

export async function sendNotification({ logger, recipients, sender, subject, textContent, key }) {
  logger('MyCustomProvider::sendNotification - Entered');
  try {
    // Your notification logic here
    logger('MyCustomProvider::sendNotification - Success');
  } catch (error) {
    logger('MyCustomProvider::sendNotification - ERROR');
    logger(error);
  }
}
```
4.  Configure your new provider in `configuration/notificationProviders.json`.

### Creating a Custom Validator

The validation system is inherently extensible through the `configuration/validations.json` file. You can create a new validator by simply adding a new object to the array in this file.

The power of the validator system comes from the combination of `xpath` and `successCondition`:

*   **`xpath`**: This is a powerful way to select any element on a web page. You can use your browser's developer tools to find the XPath of the element you want to check.
*   **`successCondition`**: This is a JavaScript expression that is evaluated against the number of nodes found by the `xpath`. This allows for a great deal of flexibility. For example:
    *   `==0`: Success if the element is *not* found (e.g., an "out of stock" message).
    *   `>0`: Success if the element *is* found (e.g., an "in stock" message).
    *   `==1`: Success if exactly one element is found.

By combining these two fields, you can create a validator for almost any website.
