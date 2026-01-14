import { binance } from '../services/binance.js';

export function handlePriceCommand(message) {
  // Extract symbol from message: "!price BTC" -> "BTC"
  const parts = message.trim().split(/\s+/);
  
  if (parts.length < 2) {
    return `❌ Please specify a symbol. Example: *!price BTC* or *!price ETH*`;
  }

  const symbol = parts[1];
  
  // Check if Binance is connected
  if (!binance.isConnected()) {
    return `⚠️ Price service is temporarily unavailable. Please try again in a moment.`;
  }

  return binance.formatPriceMessage(symbol);
}

export function isPriceCommand(message) {
  return message.trim().toLowerCase().startsWith('!price');
}

