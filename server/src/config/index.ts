import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    path: process.env.DATABASE_PATH || './database.sqlite'
  },

  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    generatedDir: process.env.GENERATED_DIR || './generated',
    maxFileSize: process.env.MAX_FILE_SIZE || '100MB'
  },

  ai: {
    defaultService: process.env.DEFAULT_AI_SERVICE || 'openai'
  },

  security: {
    encryptionSecret: process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret'
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // 解析路径为绝对路径
  getAbsolutePath(relativePath: string): string {
    return path.resolve(__dirname, '../../', relativePath);
  }
};
