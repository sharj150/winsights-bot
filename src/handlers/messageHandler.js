import { openai } from '../services/openai.js';
import { database } from '../services/database.js';
import { handlePriceCommand, isPriceCommand } from './priceHandler.js';

export async function handleMessage(message, sender) {
  const messageText = message.body?.trim();
  
  if (!messageText) {
    return null;
  }

  // Get sender info
  const contact = await message.getContact();
  const phone = sender.replace('@c.us', '');
  const name = contact.pushname || contact.name || null;

  console.log(`📩 Message from ${name || phone}: ${messageText.substring(0, 50)}...`);

  // Check for price command
  if (isPriceCommand(messageText)) {
    console.log(`💰 Processing price command`);
    return handlePriceCommand(messageText);
  }

  // Get or create user in database
  const user = database.getOrCreateUser(phone, name);

  // Process with AI
  console.log(`🤖 Processing with AI for user ${user.id}`);
  const response = await openai.chat(user.id, messageText);
  
  return response;
}

