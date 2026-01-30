"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const migrate_1 = require("./database/migrate");
const queue_1 = require("./queue");
// 路由
const project_1 = __importDefault(require("./routes/project"));
const storyboard_1 = __importDefault(require("./routes/storyboard"));
const resource_1 = __importDefault(require("./routes/resource"));
const config_2 = __importDefault(require("./routes/config"));
const generation_1 = __importDefault(require("./routes/generation"));
const script_1 = __importDefault(require("./routes/script"));
const generationSession_1 = __importDefault(require("./routes/generationSession"));
const app = (0, express_1.default)();
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 静态文件服务
app.use('/generated', express_1.default.static(config_1.config.getAbsolutePath(config_1.config.storage.generatedDir)));
app.use('/uploads', express_1.default.static(config_1.config.getAbsolutePath(config_1.config.storage.uploadDir)));
// API路由
app.use('/api/projects', project_1.default);
app.use('/api', storyboard_1.default); // 包含 /projects/:projectId/storyboards 和 /storyboards/:id
app.use('/api/resources', resource_1.default);
app.use('/api/config', config_2.default);
app.use('/api', generation_1.default); // 包含生成任务和任务状态路由
app.use('/api', script_1.default); // 口播稿会话路由
app.use('/api', generationSession_1.default); // 生成修改会话路由
// 健康检查
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 错误处理中间件
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: '服务器内部错误',
        error: config_1.config.nodeEnv === 'development' ? err.message : undefined
    });
});
// 启动服务器
async function start() {
    try {
        // 运行数据库迁移
        (0, migrate_1.runMigrations)();
        // 启动任务处理器
        queue_1.taskProcessor.start();
        app.listen(config_1.config.port, () => {
            console.log(`9Cut Server is running on port ${config_1.config.port}`);
            console.log(`Environment: ${config_1.config.nodeEnv}`);
            console.log(`Database: ${config_1.config.database.path}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// 优雅关闭
process.on('SIGINT', () => {
    console.log('Shutting down...');
    queue_1.taskProcessor.stop();
    process.exit(0);
});
start();
exports.default = app;
//# sourceMappingURL=index.js.map