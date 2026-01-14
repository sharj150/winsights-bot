import OpenAI from 'openai';
import { config } from '../config.js';
import { getSystemPrompt, getLearningPrompt } from '../prompts/systemPrompt.js';
import { database } from './database.js';

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.model;
    console.log(`🤖 OpenAI service initialized with model: ${this.model}`);
  }

  async chat(userId, userMessage) {
    try {
      // Get user's chat history
      const recentMessages = database.getRecentMessages(userId);
      
      // Get user summary for personalization
      const userSummary = database.getUserSummary(userId);
      
      // Build messages array
      const messages = [
        { role: 'system', content: getSystemPrompt(userSummary) },
        ...recentMessages.map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ];

      // Call OpenAI
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;

      // Save messages to database
      database.saveMessage(userId, 'user', userMessage);
      database.saveMessage(userId, 'assistant', assistantMessage);

      // Check if we should update user learning
      const messageCount = database.getMessageCount(userId);
      if (messageCount > 0 && messageCount % config.memory.summaryThreshold === 0) {
        this.updateUserLearning(userId);
      }

      return assistantMessage;
    } catch (error) {
      console.error('OpenAI Error:', error.message);
      
      if (error.code === 'insufficient_quota') {
        return '⚠️ I apologize, but the AI service is currently unavailable. Please try again later or contact support.';
      }
      
      if (error.code === 'invalid_api_key') {
        return '⚠️ There\'s a configuration issue with the AI service. Please contact support.';
      }
      
      return '⚠️ I encountered an error processing your request. Please try again.';
    }
  }

  async updateUserLearning(userId) {
    try {
      // Get all messages for analysis
      const messages = database.getRecentMessages(userId, 50);
      
      if (messages.length < 10) return; // Not enough data

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an analyst extracting user preferences from conversation history.' },
          { role: 'user', content: getLearningPrompt(messages) }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const analysis = response.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(analysis);
        database.updateUserSummary(userId, {
          tradingStyle: parsed.tradingStyle,
          favoriteAssets: parsed.favoriteAssets,
          commonQuestions: parsed.commonQuestions,
          summary: parsed.summary,
        });
        console.log(`📊 Updated learning for user ${userId}`);
      } catch (parseError) {
        console.error('Failed to parse learning analysis:', parseError.message);
      }
    } catch (error) {
      console.error('Learning update error:', error.message);
    }
  }
}

export const openai = new OpenAIService();

