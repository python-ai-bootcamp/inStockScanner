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

### 1. Mailjet API Keys

The script requires Mailjet API credentials to send emails.

1.  Create a file named `.mailjet_api_key.json` inside the `private_keys` directory.
2.  Add your Mailjet API key and secret to this file in the following format:

    ```json
    {
      "key": "YOUR_MAILJET_API_KEY",
      "secret": "YOUR_MAILJET_API_SECRET"
    }
    ```

### 2. Products to Check (`validations.json`)

The `validations.json` file contains an array of products to monitor.

*   `url`: The URL of the product page.
*   `xpath`: An XPath expression to select an element on the page. This is typically used to find an "out of stock" message.
*   `successCondition`: A JavaScript condition that evaluates to `true` when the product is considered in stock. The condition is evaluated against the number of nodes found by the `xpath`. For example, if the `xpath` points to an "out of stock" message, the `successCondition` would be `==0`, meaning success is when the message is not found.
*   `enabled`: Set to `true` to enable the check for this product, or `false` to disable it.
*   `refactoryPeriod_hour`: The number of hours to wait before sending another notification for this product after it's found to be in stock.

**Example `validations.json`:**

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

### 3. Email Recipients (`mailRecipients.json`)

The `mailRecipients.json` file contains a list of people to notify.

**Example `mailRecipients.json`:**

```json
[
  {
    "Email": "recipient1@example.com",
    "Name": "Recipient One"
  },
  {
    "Email": "recipient2@example.com",
    "Name": "Recipient Two"
  }
]
```

## Usage

To run the script, use the following command:

```bash
node main.mjs
```

The script will log its progress to the console and to a `log.txt` file.

## How It Works

The script uses `puppeteer` to launch a headless Chrome browser and navigate to the URLs specified in `validations.json`. For each URL, it uses the provided `xpath` to count the number of matching elements on the page. It then evaluates the `successCondition` to determine if the product is in stock.

If a product is in stock and not within its refactory period, it is added to a list of available products. After checking all products, if this list is not empty, the script uses the Mailjet API to send an email to all recipients in `mailRecipients.json`.

The `refactoryPeriods.json` file is automatically created and managed by the script to keep track of when a notification was last sent for each product, ensuring you don't get duplicate alerts.
