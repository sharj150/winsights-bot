import Database from 'better-sqlite3';
import crypto from 'crypto';
import { config } from '../config.js';

class DatabaseService {
  constructor() {
    this.db = new Database(config.database.path);
    this.initTables();
  }

  initTables() {
    // Users table - stores user info and preferences
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_hash TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        preferences TEXT DEFAULT '{}'
      )
    `);

    // Messages table - stores chat history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // User summaries - stores learned preferences about each user
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        trading_style TEXT,
        favorite_assets TEXT,
        common_questions TEXT,
        summary TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('📦 Database initialized');
  }

  // Hash phone number for privacy
  hashPhone(phone) {
    return crypto.createHash('sha256').update(phone).digest('hex');
  }

  // Get or create user
  getOrCreateUser(phone, name = null) {
    const phoneHash = this.hashPhone(phone);
    
    let user = this.db.prepare('SELECT * FROM users WHERE phone_hash = ?').get(phoneHash);
    
    if (!user) {
      const result = this.db.prepare(
        'INSERT INTO users (phone_hash, name) VALUES (?, ?)'
      ).run(phoneHash, name);
      
      user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      console.log(`👤 New user created: ${name || 'Unknown'}`);
    } else {
      // Update last active
      this.db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    }
    
    return user;
  }

  // Save a message
  saveMessage(userId, role, content) {
    this.db.prepare(
      'INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)'
    ).run(userId, role, content);
  }

  // Get recent messages for context
  getRecentMessages(userId, limit = config.memory.maxMessagesPerUser) {
    return this.db.prepare(`
      SELECT role, content, created_at 
      FROM messages 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit).reverse();
  }

  // Get message count for user
  getMessageCount(userId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ?'
    ).get(userId);
    return result.count;
  }

  // Get or create user summary
  getUserSummary(userId) {
    return this.db.prepare('SELECT * FROM user_summaries WHERE user_id = ?').get(userId);
  }

  // Update user summary (learned preferences)
  updateUserSummary(userId, data) {
    const existing = this.getUserSummary(userId);
    
    if (existing) {
      this.db.prepare(`
        UPDATE user_summaries 
        SET trading_style = COALESCE(?, trading_style),
            favorite_assets = COALESCE(?, favorite_assets),
            common_questions = COALESCE(?, common_questions),
            summary = COALESCE(?, summary),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        data.tradingStyle || null,
        data.favoriteAssets || null,
        data.commonQuestions || null,
        data.summary || null,
        userId
      );
    } else {
      this.db.prepare(`
        INSERT INTO user_summaries (user_id, trading_style, favorite_assets, common_questions, summary)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        data.tradingStyle || null,
        data.favoriteAssets || null,
        data.commonQuestions || null,
        data.summary || null
      );
    }
  }

  // Get user preferences
  getUserPreferences(userId) {
    const user = this.db.prepare('SELECT preferences FROM users WHERE id = ?').get(userId);
    return user ? JSON.parse(user.preferences) : {};
  }

  // Update user preferences
  updateUserPreferences(userId, preferences) {
    const current = this.getUserPreferences(userId);
    const merged = { ...current, ...preferences };
    this.db.prepare('UPDATE users SET preferences = ? WHERE id = ?').run(
      JSON.stringify(merged),
      userId
    );
  }

  // Close database connection
  close() {
    this.db.close();
    console.log('📦 Database connection closed');
  }
}

// Export singleton instance
export const database = new DatabaseService();

