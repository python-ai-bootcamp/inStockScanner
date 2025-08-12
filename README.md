# Website Availability Checker

This project is a Node.js-based web scraper that automatically checks a list of websites for product availability and sends email notifications when a product is back in stock.

## Features

*   **Configurable Product Checks:** Easily configure which products to check via a simple JSON file.
*   **Email Notifications:** Uses Mailjet to send email notifications to a configurable list of recipients when a product is found to be in stock.
*   **Refactory Period:** Avoids spamming notifications by implementing a "refactory period" for each product, preventing repeated notifications for a set amount of time.
*   **Customizable Success Conditions:** Define what "in stock" means for each product using XPath expressions and success conditions.

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

### 1. Notification Providers (`configuration/notificationProviders.json`)

The `configuration/notificationProviders.json` file contains an array of notification providers to use. This allows for sending notifications through multiple channels (e.g., multiple email providers).

Each object in the array should have the following properties:

*   `provider`: The name of the provider module located in the `providers/` directory (e.g., `mailjet.mjs`).
*   `key`: An object containing the API key and secret for the provider. For Mailjet, this would be `{"key": "YOUR_API_KEY", "secret": "YOUR_SECRET"}`.
*   `recipients`: An array of recipient objects, each with `Email` and `Name` properties.
*   `sender`: An object with `Email` and `Name` properties for the sender.

**Example `configuration/notificationProviders.json`:**

```json
[
  {
    "provider": "mailjet.mjs",
    "key": {
      "key": "YOUR_MAILJET_API_KEY",
      "secret": "YOUR_MAILJET_API_SECRET"
    },
    "recipients": [
      {
        "Email": "recipient1@example.com",
        "Name": "Recipient One"
      }
    ],
    "sender": {
      "Email": "sender@example.com",
      "Name": "Website Availability Checker"
    }
  }
]
```

### 2. Products to Check (`configuration/validations.json`)

The `configuration/validations.json` file contains an array of products to monitor.

*   `url`: The URL of the product page.
*   `xpath`: An XPath expression to select an element on the page. This is typically used to find an "out of stock" message.
*   `successCondition`: A JavaScript condition that evaluates to `true` when the product is considered in stock. The condition is evaluated against the number of nodes found by the `xpath`. For example, if the `xpath` points to an "out of stock" message, the `successCondition` would be `==0`, meaning success is when the message is not found.
*   `enabled`: Set to `true` to enable the check for this product, or `false` to disable it.
*   `refactoryPeriod_hour`: The number of hours to wait before sending another notification for this product after it's found to be in stock.

**Example `configuration/validations.json`:**

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

To run the script, use the following command:

```bash
node main.mjs
```

The script will log its progress to the console and to a `log.txt` file.

## Scheduling the Checker

To run the checker automatically on a schedule, you can use the provided installation scripts for Windows and Linux.

### Windows

1.  Open PowerShell with **Administrator privileges** ("Run as Administrator").
2.  Navigate to the project's root directory.
3.  Run the installation script:
    ```powershell
    .\install-task.ps1
    ```
    This will create a new scheduled task named "WebsiteAvailabilityChecker" that runs the `main.mjs` script every hour.

### Linux

1.  Open your terminal.
2.  Navigate to the project's root directory.
3.  Make the installation script executable:
    ```bash
    chmod +x install-task.sh
    ```
4.  Run the script:
    ```bash
    ./install-task.sh
    ```
    This will add a cron job that runs the `main.mjs` script at the beginning of every hour. The output of the script will be logged to `cron.log` in the project directory.

## How It Works

The script uses `puppeteer` to launch a headless Chrome browser and navigate to the URLs specified in `configuration/validations.json`. For each URL, it uses the provided `xpath` to count the number of matching elements on the page. It then evaluates the `successCondition` to determine if the product is in stock.

If a product is in stock and not within its refactory period, it is added to a list of available products. After checking all products, if this list is not empty, the script uses the Mailjet API to send an email to all recipients in `configuration/mailRecipients.json`.

The `configuration/refactoryPeriods.json` file is automatically created and managed by the script to keep track of when a notification was last sent for each product, ensuring you don't get duplicate alerts.
