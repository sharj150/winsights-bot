import WebSocket from 'ws';
import { config } from '../config.js';

class BinanceService {
  constructor() {
    this.prices = new Map();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.subscribedSymbols = new Set();
    
    // Popular trading pairs to track by default
    this.defaultSymbols = [
      'btcusdt', 'ethusdt', 'bnbusdt', 'xrpusdt', 'adausdt',
      'dogeusdt', 'solusdt', 'dotusdt', 'maticusdt', 'ltcusdt',
      'linkusdt', 'avaxusdt', 'atomusdt', 'uniusdt', 'xlmusdt'
    ];
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Subscribe to mini ticker stream for all symbols
        const streamUrl = `${config.binance.wsUrl}/!miniTicker@arr`;
        
        this.ws = new WebSocket(streamUrl);

        this.ws.on('open', () => {
          console.log('📊 Binance WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const tickers = JSON.parse(data);
            
            // Update prices for all received tickers
            for (const ticker of tickers) {
              const symbol = ticker.s.toLowerCase();
              this.prices.set(symbol, {
                symbol: ticker.s,
                price: parseFloat(ticker.c),
                high24h: parseFloat(ticker.h),
                low24h: parseFloat(ticker.l),
                volume: parseFloat(ticker.v),
                priceChange: parseFloat(ticker.c) - parseFloat(ticker.o),
                priceChangePercent: ((parseFloat(ticker.c) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100,
                lastUpdate: Date.now()
              });
            }
          } catch (error) {
            // Silently ignore parse errors for individual messages
          }
        });

        this.ws.on('error', (error) => {
          console.error('Binance WebSocket error:', error.message);
        });

        this.ws.on('close', () => {
          console.log('📊 Binance WebSocket disconnected');
          this.handleReconnect();
        });

      } catch (error) {
        console.error('Failed to connect to Binance:', error.message);
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`📊 Reconnecting to Binance in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    } else {
      console.error('📊 Max reconnection attempts reached for Binance');
    }
  }

  getPrice(symbol) {
    // Normalize symbol input
    let normalizedSymbol = symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Handle common formats: BTC, BTCUSDT, BTC/USDT
    if (!normalizedSymbol.endsWith('usdt') && !normalizedSymbol.endsWith('busd')) {
      normalizedSymbol = normalizedSymbol + 'usdt';
    }

    const priceData = this.prices.get(normalizedSymbol);
    
    if (!priceData) {
      return null;
    }

    return priceData;
  }

  formatPriceMessage(symbol) {
    const data = this.getPrice(symbol);
    
    if (!data) {
      return `❌ Could not find price for "${symbol.toUpperCase()}". Make sure it's a valid trading pair on Binance.`;
    }

    const changeEmoji = data.priceChangePercent >= 0 ? '📈' : '📉';
    const changeSign = data.priceChangePercent >= 0 ? '+' : '';
    
    // Format price based on value
    const formatPrice = (price) => {
      if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (price >= 1) return price.toFixed(4);
      if (price >= 0.0001) return price.toFixed(6);
      return price.toFixed(8);
    };

    return `${changeEmoji} *${data.symbol}*

💰 Price: $${formatPrice(data.price)}
📊 24h Change: ${changeSign}${data.priceChangePercent.toFixed(2)}%
📈 24h High: $${formatPrice(data.high24h)}
📉 24h Low: $${formatPrice(data.low24h)}
📦 24h Volume: ${data.volume.toLocaleString('en-US', { maximumFractionDigits: 0 })}

_Data from Binance_`;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export const binance = new BinanceService();

