const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });
const validStates = ["AL", "AK", "AZ", "AR", "AS", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "TT", "UT", "VT", "VA", "VI", "WA", "WV", "WI", "WY"];

// Initialize SQLite Database
const db = new sqlite3.Database('proxy_bot.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Function to create the proxy_keys table
function initializeDatabase() {
  db.run("CREATE TABLE IF NOT EXISTS proxy_keys (key TEXT PRIMARY KEY, validity_period INTEGER NOT NULL, redeemed BOOLEAN NOT NULL DEFAULT 0)", (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table proxy_keys created or already exists.");
    }
  });
}

bot.onText(/\/redeem (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const key = match[1];

  try {
    // Check the key's validity and retrieve its details
    const keyData = await checkAndRetrieveKeyData(key);
    if (!keyData) {
      bot.sendMessage(chatId, "Invalid or already redeemed key.");
      return;
    }

    // Ask for the user's IP address with validation and attempt limit
    bot.sendMessage(chatId, "Please enter the IP address to whitelist:");
    const ipResponse = await waitForUserResponse(chatId, validateIpAddress);

    // Ask for the state with validation and attempt limit
    bot.sendMessage(chatId, "Please enter the state abbreviation for the proxy:");
    const stateResponse = await waitForUserResponse(chatId, validateState);

    // Make the API call to buy proxies
    const apiUrl = `https://api.proxylte.com/buyProxy.php?key=YOUR_API_KEY&request_id=${generateUniqueRequestId()}&proxy_nr=1&days_nr=${keyData.validity_period}&proxy_type=SOCKS5&conn_type=WIFI_AND_CELLULAR&region_code=${stateResponse.text.toUpperCase()}&client_ip=${ipResponse.text}`;
    const apiResponse = await axios.get(apiUrl);

    // Handle the response
    bot.sendMessage(chatId, `Proxies generated: ${JSON.stringify(apiResponse.data)}`);
  } catch (error) {
    if (error.message === "Too many invalid attempts.") {
      bot.sendMessage(chatId, "Process cancelled due to too many invalid attempts.");
    } else {
      console.error(error);
      bot.sendMessage(chatId, "An error occurred while processing your request.");
    }
  }
});

// Function to check the key's validity and retrieve its data (implementation needed)
async function checkAndRetrieveKeyData(key) {
  // ...
}

// Function to wait for the user's response with a limit on invalid attempts
function waitForUserResponse(chatId, validationFunc, maxAttempts = 2) {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const responseHandler = (msg) => {
      if (msg.chat.id === chatId) {
        const isValid = validationFunc(msg.text);

        if (isValid) {
          bot.removeMessageListener(responseHandler);
          resolve(msg);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            bot.removeMessageListener(responseHandler);
            reject(new Error("Too many invalid attempts."));
          } else {
            bot.sendMessage(chatId, "Invalid input. Please try again:");
          }
        }
      }
    };

    bot.on('message', responseHandler);
  });
}

// IP address validation function (implement according to your needs)
function validateIpAddress(input) {
  // Regex pattern for IP validation (example)
  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(input);
}

// State validation function
function validateState(input) {
  return validStates.includes(input.toUpperCase().trim());
}

// Function to generate a unique request ID (implementation needed)
function generateUniqueRequestId() {
  // ...
}
