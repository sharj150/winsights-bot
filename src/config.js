import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // OpenAI Settings
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  },

  // Bot Settings
  bot: {
    name: process.env.BOT_NAME || 'Winsights AI',
    companyName: process.env.COMPANY_NAME || 'Winsights',
  },

  // Database Settings
  database: {
    path: './data/winsights.db',
  },

  // Chat Memory Settings
  memory: {
    maxMessagesPerUser: 20, // Keep last 20 messages for context
    summaryThreshold: 50,   // Create summary after 50 messages
  },

  // Binance Settings
  binance: {
    wsUrl: 'wss://stream.binance.com:9443/ws',
  },
};

