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
