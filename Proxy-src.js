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
  db.run("CREATE TABLE IF NOT EXISTS proxy_keys (key TEXT PRIMARY KEY, rotation_interval TEXT; validity_period INTEGER NOT NULL, redeemed BOOLEAN NOT NULL DEFAULT 0)", (err) => {
    if (err) {
      console.error("Error creating table:", err.message);
    } else {
      console.log("Table proxy_keys created or already exists.");
    }
  });
}

// Bot onText listener for the /generate command
bot.onText(/\/generate (\d+) (\w+) (\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Admin check
  if (!adminIds.includes(userId)) {
    bot.sendMessage(chatId, "You are not authorized to use this command.");
    return;
  }

  const numberOfKeys = parseInt(match[1]);
  const rotationInterval = match[2]; // e.g., '15m'
  const validity = match[3]; // e.g., '1Day'

  // Validate the number of keys and validity period
  if (isNaN(numberOfKeys) || numberOfKeys <= 0) {
    bot.sendMessage(chatId, "Invalid number of keys specified.");
    return;
  }

  if (!['1Day', '3Days', '7Days'].includes(validity)) {
    bot.sendMessage(chatId, "Invalid validity period. Choose from 1Day, 3Days, or 7Days.");
    return;
  }

  const validityPeriod = validity === '1Day' ? 1 : (validity === '3Days' ? 3 : 7);
  let generatedKeys = [];

  for (let i = 0; i < numberOfKeys; i++) {
    const newKey = generateUniqueKey();
    insertKey(newKey, validityPeriod, rotationInterval);
    generatedKeys.push(newKey);
  }

  bot.sendMessage(chatId, `Generated keys:\n${generatedKeys.join('\n')}`);
});

// Function to generate a unique key
function generateUniqueKey() {
  return Math.random().toString(36).substr(2, 9);
}

// Function to insert a new key into the database
function insertKey(key, validityPeriod, rotationInterval) {
  const stmt = db.prepare("INSERT INTO proxy_keys (key, validity_period, rotation_interval) VALUES (?, ?, ?)");
  stmt.run(key, validityPeriod, rotationInterval, (err) => {
    if (err) {
      console.error("Error inserting key:", err.message);
    }
  });
  stmt.finalize();
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
