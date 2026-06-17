import fs from 'fs';
import path from 'path';
import mysql, { Pool } from 'mysql2/promise';

// Define TS Interfaces for models
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  google_id: string | null;
  profile_image: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Scan {
  id: number;
  user_id: number;
  image_url: string; // Base64 or string URL
  category: string;
  confidence: number;
  recommendation: string;
  disposal_method?: string;
  recycling_method?: string;
  environmental_impact?: string;
  created_at: string;
}

export interface ChatHistory {
  id: number;
  user_id: number;
  question: string;
  answer: string;
  created_at: string;
}

// Check database mode
const USE_MYSQL = !!(process.env.DB_HOST && process.env.DB_HOST !== 'localhost' || process.env.MYSQL_URI);

let mysqlPool: Pool | null = null;
const jsonDbPath = path.join(process.cwd(), 'database', 'local_db');

// Ensure local db directory exists
if (!USE_MYSQL) {
  if (!fs.existsSync(jsonDbPath)) {
    fs.mkdirSync(jsonDbPath, { recursive: true });
  }
}

// Helper to write/read JSON files
function getLocalFile<T>(filename: string, defaultData: T[]): T[] {
  const filePath = path.join(jsonDbPath, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return defaultData;
  }
}

function saveLocalFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(jsonDbPath, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Initialize MySQL pool
if (USE_MYSQL) {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ecosmart_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('Database Mode: MySQL connection pool created.');
  } catch (error) {
    console.error('Failed to initialize MySQL pool, falling back to JSON database.', error);
    mysqlPool = null;
  }
} else {
  console.log('Database Mode: Using Local JSON File database at', jsonDbPath);
}

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'System Admin',
    email: 'admin@ecosmart.com',
    password: '$2b$10$v094W4zK.N4PscK.iY.8DeCOqgQ9Q5nPhP7vNlGjZ4y9u1vBIdf1m', // hash of admin123
    google_id: null,
    profile_image: null,
    role: 'admin',
    created_at: '2026-06-09T13:00:00.000Z'
  }
];

// Database Abstraction API Wrapper
export const db = {
  isMySQL(): boolean {
    return USE_MYSQL && mysqlPool !== null;
  },

  // Users Table Queries
  async getUsers(): Promise<User[]> {
    if (this.isMySQL() && mysqlPool) {
      const [rows] = await mysqlPool.execute('SELECT * FROM users ORDER BY id DESC');
      return rows as User[];
    } else {
      return getLocalFile<User>('users', DEFAULT_USERS);
    }
  },

  async findUserByEmail(email: string): Promise<User | null> {
    if (this.isMySQL() && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      return rows[0] || null;
    } else {
      const users = getLocalFile<User>('users', DEFAULT_USERS);
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async findUserById(id: number): Promise<User | null> {
    if (this.isMySQL() && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      return rows[0] || null;
    } else {
      const users = getLocalFile<User>('users', DEFAULT_USERS);
      return users.find(u => u.id === id) || null;
    }
  },

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    if (this.isMySQL() && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT * FROM users WHERE google_id = ? LIMIT 1', [googleId]);
      return rows[0] || null;
    } else {
      const users = getLocalFile<User>('users', DEFAULT_USERS);
      return users.find(u => u.google_id === googleId) || null;
    }
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const name = userData.name || 'Eco User';
    const email = userData.email || '';
    const password = userData.password || '';
    const googleId = userData.google_id || null;
    const profileImage = userData.profile_image || null;
    const role = userData.role || 'user';
    const createdAt = new Date().toISOString();

    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        'INSERT INTO users (name, email, password, google_id, profile_image, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, password, googleId, profileImage, role, createdAt]
      );
      return {
        id: result.insertId,
        name,
        email,
        password,
        google_id: googleId,
        profile_image: profileImage,
        role,
        created_at: createdAt
      };
    } else {
      const users = getLocalFile<User>('users', DEFAULT_USERS);
      const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const newUser: User = {
        id: newId,
        name,
        email,
        password,
        google_id: googleId,
        profile_image: profileImage,
        role: role as 'user' | 'admin',
        created_at: createdAt
      };
      users.push(newUser);
      saveLocalFile<User>('users', users);
      return newUser;
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      let users = getLocalFile<User>('users', DEFAULT_USERS);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return false;
      users.splice(index, 1);
      saveLocalFile<User>('users', users);

      // Cascade deletes for scans and chat history in local DB
      let scans = getLocalFile<Scan>('scans', []);
      scans = scans.filter(s => s.user_id !== id);
      saveLocalFile<Scan>('scans', scans);

      let chat = getLocalFile<ChatHistory>('chat_history', []);
      chat = chat.filter(c => c.user_id !== id);
      saveLocalFile<ChatHistory>('chat_history', chat);

      return true;
    }
  },

  // Scans Table Queries
  async getScans(userId?: number): Promise<Scan[]> {
    if (this.isMySQL() && mysqlPool) {
      if (userId) {
        const [rows] = await mysqlPool.execute('SELECT * FROM scans WHERE user_id = ? ORDER BY id DESC', [userId]);
        return rows as Scan[];
      } else {
        const [rows] = await mysqlPool.execute('SELECT * FROM scans ORDER BY id DESC');
        return rows as Scan[];
      }
    } else {
      const scans = getLocalFile<Scan>('scans', []);
      if (userId) {
        return scans.filter(s => s.user_id === userId).sort((a, b) => b.id - a.id);
      }
      return scans.sort((a, b) => b.id - a.id);
    }
  },

  async createScan(scanData: Omit<Scan, 'id' | 'created_at'>): Promise<Scan> {
    const createdAt = new Date().toISOString();
    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        `INSERT INTO scans (user_id, image_url, category, confidence, recommendation, disposal_method, recycling_method, environmental_impact, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scanData.user_id,
          scanData.image_url,
          scanData.category,
          scanData.confidence,
          scanData.recommendation,
          scanData.disposal_method || null,
          scanData.recycling_method || null,
          scanData.environmental_impact || null,
          createdAt
        ]
      );
      return {
        id: result.insertId,
        ...scanData,
        created_at: createdAt
      };
    } else {
      const scans = getLocalFile<Scan>('scans', []);
      const newId = scans.length > 0 ? Math.max(...scans.map(s => s.id)) + 1 : 1;
      const newScan: Scan = {
        id: newId,
        ...scanData,
        created_at: createdAt
      };
      scans.push(newScan);
      saveLocalFile<Scan>('scans', scans);
      return newScan;
    }
  },

  async deleteScan(id: number): Promise<boolean> {
    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute('DELETE FROM scans WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      const scans = getLocalFile<Scan>('scans', []);
      const index = scans.findIndex(s => s.id === id);
      if (index === -1) return false;
      scans.splice(index, 1);
      saveLocalFile<Scan>('scans', scans);
      return true;
    }
  },

  // Chat History Table Queries
  async getChatHistory(userId?: number): Promise<ChatHistory[]> {
    if (this.isMySQL() && mysqlPool) {
      if (userId) {
        const [rows] = await mysqlPool.execute('SELECT * FROM chat_history WHERE user_id = ? ORDER BY id ASC', [userId]);
        return rows as ChatHistory[];
      } else {
        const [rows] = await mysqlPool.execute('SELECT * FROM chat_history ORDER BY id ASC');
        return rows as ChatHistory[];
      }
    } else {
      const chat = getLocalFile<ChatHistory>('chat_history', []);
      if (userId) {
        return chat.filter(c => c.user_id === userId);
      }
      return chat;
    }
  },

  async createChatHistory(chatData: Omit<ChatHistory, 'id' | 'created_at'>): Promise<ChatHistory> {
    const createdAt = new Date().toISOString();
    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        'INSERT INTO chat_history (user_id, question, answer, created_at) VALUES (?, ?, ?, ?)',
        [chatData.user_id, chatData.question, chatData.answer, createdAt]
      );
      return {
        id: result.insertId,
        ...chatData,
        created_at: createdAt
      };
    } else {
      const chat = getLocalFile<ChatHistory>('chat_history', []);
      const newId = chat.length > 0 ? Math.max(...chat.map(c => c.id)) + 1 : 1;
      const newChat: ChatHistory = {
        id: newId,
        ...chatData,
        created_at: createdAt
      };
      chat.push(newChat);
      saveLocalFile<ChatHistory>('chat_history', chat);
      return newChat;
    }
  },

  async deleteChatHistory(id: number): Promise<boolean> {
    if (this.isMySQL() && mysqlPool) {
      const [result]: any = await mysqlPool.execute('DELETE FROM chat_history WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } else {
      const chat = getLocalFile<ChatHistory>('chat_history', []);
      const index = chat.findIndex(c => c.id === id);
      if (index === -1) return false;
      chat.splice(index, 1);
      saveLocalFile<ChatHistory>('chat_history', chat);
      return true;
    }
  }
};
