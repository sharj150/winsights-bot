import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { config } from './config.js';
import { handleMessage } from './handlers/messageHandler.js';
import { binance } from './services/binance.js';
import { database } from './services/database.js';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ${config.bot.name} - WhatsApp Finance Bot            ║
║   📊 Powered by ${config.bot.companyName}                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// QR Code generation
client.on('qr', (qr) => {
  console.log('\n📱 Scan this QR code with WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\nOpen WhatsApp → Settings → Linked Devices → Link a Device\n');
});

// Authentication success
client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated successfully');
});

// Authentication failure
client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
});

// Client ready
client.on('ready', async () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('📊 Connecting to Binance...');
  
  try {
    await binance.connect();
    console.log('\n🎉 Bot is fully operational!\n');
    console.log('Commands:');
    console.log('  !price <symbol> - Get crypto price (e.g., !price BTC)');
    console.log('  Any message - Chat with AI about finance\n');
  } catch (error) {
    console.error('⚠️ Binance connection failed, price commands may not work');
  }
});

// Message handler
client.on('message', async (message) => {
  try {
    // Ignore messages from groups (only respond to direct messages)
    const chat = await message.getChat();
    if (chat.isGroup) {
      return;
    }

    // Ignore status updates
    if (message.isStatus) {
      return;
    }

    // Process message
    const response = await handleMessage(message, message.from);
    
    if (response) {
      await message.reply(response);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      await message.reply('⚠️ Sorry, I encountered an error. Please try again.');
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  }
});

// Disconnection handler
client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp client disconnected:', reason);
  console.log('🔄 Attempting to reconnect...');
  client.initialize();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  binance.disconnect();
  database.close();
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down...');
  binance.disconnect();
  database.close();
  await client.destroy();
  process.exit(0);
});

// Initialize client
console.log('🔄 Initializing WhatsApp client...\n');
client.initialize();

