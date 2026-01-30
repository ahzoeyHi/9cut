"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
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
    getAbsolutePath(relativePath) {
        return path_1.default.resolve(__dirname, '../../', relativePath);
    }
};
//# sourceMappingURL=index.js.map