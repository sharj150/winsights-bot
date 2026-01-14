# Winsights WhatsApp Finance Bot

A WhatsApp bot powered by ChatGPT for financial consulting. Built for Winsights.

## Features

- **AI-Powered Finance Chat** - GPT-5-mini integration focused strictly on finance, markets, and trading
- **Live Crypto Prices** - Real-time prices from Binance via `!price` command
- **Chat Memory** - Remembers conversation history and learns user preferences
- **User Learning** - Adapts to each user's trading style and interests over time

## Quick Start

### 1. Install Dependencies

```bash
cd "/Users/sharj/Documents/winsights bot"
npm install
```

### 2. Configure Environment

The `.env` file is already set up with your API key. If you need to change it:

```bash
# Edit .env file
nano .env
```

### 3. Run the Bot

```bash
npm start
```

### 4. Scan QR Code

When the bot starts, a QR code will appear in the terminal. Scan it with WhatsApp:
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices → Link a Device
3. Scan the QR code

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!price <symbol>` | Get live crypto price | `!price BTC`, `!price ETH` |
| Any message | Chat with AI about finance | "What's your view on Bitcoin?" |

## Architecture

```
src/
├── index.js              # Main entry point & WhatsApp client
├── config.js             # Configuration
├── handlers/
│   ├── messageHandler.js # Routes messages
│   └── priceHandler.js   # !price command
├── services/
│   ├── openai.js         # ChatGPT integration
│   ├── binance.js        # Binance WebSocket
│   └── database.js       # SQLite chat memory
└── prompts/
    └── systemPrompt.js   # AI personality & rules
```

## Bot Behavior

### Finance-Only Policy
The bot ONLY discusses:
- Cryptocurrency and blockchain
- Stock markets, forex, commodities
- Technical and fundamental analysis
- Economic news and geopolitics (market-related)
- Trading strategies and risk management

Off-topic questions are politely declined.

### Chat Memory
- Stores last 20 messages per user for context
- Learns user preferences over time (trading style, favorite assets)
- Creates personalized responses based on history

### !price Command
- Bypasses AI completely
- Fetches real-time data from Binance WebSocket
- Shows price, 24h change, high/low, and volume

## Troubleshooting

### "WhatsApp client disconnected"
The bot will auto-reconnect. If it persists, delete `.wwebjs_auth/` folder and scan QR again.

### "Price service unavailable"
Binance WebSocket may be reconnecting. Wait a moment and try again.

### "AI service unavailable"
Check your OpenAI API key in `.env` and ensure you have credits.

## Auto-Save

This project has auto-save enabled. Changes are automatically committed and pushed to GitHub.

- Check status: `./autosave.sh status`
- View logs: `tail -f .autosave.log`

## Repository

GitHub: https://github.com/sharj150/winsights-bot
