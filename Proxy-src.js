const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });

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
