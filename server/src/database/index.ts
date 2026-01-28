import Database from 'better-sqlite3';
import path from 'path';
import { config } from '../config';

const dbPath = config.getAbsolutePath(config.database.path);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
import fs from 'fs';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
