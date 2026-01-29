import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { runMigrations } from './database/migrate';
import { taskProcessor } from './queue';

// 路由
import projectRoutes from './routes/project';
import storyboardRoutes from './routes/storyboard';
import resourceRoutes from './routes/resource';
import configRoutes from './routes/config';
import generationRoutes from './routes/generation';
import scriptRoutes from './routes/script';
import generationSessionRoutes from './routes/generationSession';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/generated', express.static(config.getAbsolutePath(config.storage.generatedDir)));
app.use('/uploads', express.static(config.getAbsolutePath(config.storage.uploadDir)));

// API路由
app.use('/api/projects', projectRoutes);
app.use('/api', storyboardRoutes); // 包含 /projects/:projectId/storyboards 和 /storyboards/:id
app.use('/api/resources', resourceRoutes);
app.use('/api/config', configRoutes);
app.use('/api', generationRoutes); // 包含生成任务和任务状态路由
app.use('/api', scriptRoutes); // 口播稿会话路由
app.use('/api', generationSessionRoutes); // 生成修改会话路由

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: '服务器内部错误',
    error: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// 启动服务器
async function start() {
  try {
    // 运行数据库迁移
    runMigrations();

    // 启动任务处理器
    taskProcessor.start();

    app.listen(config.port, () => {
      console.log(`9Cut Server is running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Database: ${config.database.path}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Shutting down...');
  taskProcessor.stop();
  process.exit(0);
});

start();

export default app;
