# 9Cut 口播视频自动生成系统 - 系统设计文档

## 1. 概述

### 1.1 系统简介

9Cut是一个自动化口播视频生成系统，采用前后端分离架构。前端使用Vue 3构建SPA应用，通过nginx部署；后端使用Node.js提供API服务，使用SQLite作为数据存储。系统集成多种AI服务，实现从文案到视频的全流程自动化生成。

### 1.2 设计目标

- **模块化**: 各功能模块独立，便于维护和扩展
- **可配置**: AI服务和提示词灵活配置
- **可重试**: 每个环节支持独立重新生成
- **高效**: 支持并行处理，提升生成效率
- **易部署**: 支持nginx静态部署

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理)                          │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │    静态资源 (Vue 3 SPA)   │     API代理 (/api/*)           │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Node.js Backend Server                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │   路由层      │   服务层      │   数据层      │   工具层      │  │
│  │  (Express)   │  (Services)  │   (SQLite)   │  (Utils)     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   AI 文本服务      │   │   AI 图片服务      │   │   AI 语音服务      │
│ Claude/Gemini/... │   │  DALL-E/SD/...    │   │   火山/Azure/...   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### 2.2 前端架构

```
src/
├── api/                    # API请求封装
│   ├── project.ts          # 项目相关API
│   ├── storyboard.ts       # 分镜相关API
│   ├── resource.ts         # 资源相关API
│   ├── config.ts           # 配置相关API
│   └── generation.ts       # 生成任务API
├── components/             # 通用组件
│   ├── common/             # 基础组件
│   ├── storyboard/         # 分镜组件
│   ├── resource/           # 资源组件
│   └── config/             # 配置组件
├── views/                  # 页面视图
│   ├── Home.vue            # 首页/项目列表
│   ├── Project.vue         # 项目详情
│   ├── Storyboard.vue      # 分镜编辑
│   ├── NineGrid.vue        # 9宫格视图
│   ├── Resources.vue       # 资源管理
│   └── Settings.vue        # 系统设置
├── stores/                 # Pinia状态管理
│   ├── project.ts          # 项目状态
│   ├── storyboard.ts       # 分镜状态
│   ├── generation.ts       # 生成任务状态
│   └── config.ts           # 配置状态
├── composables/            # 组合式函数
│   ├── useGeneration.ts    # 生成任务逻辑
│   ├── usePolling.ts       # 轮询逻辑
│   └── useNotification.ts  # 通知逻辑
├── router/                 # 路由配置
├── utils/                  # 工具函数
└── types/                  # TypeScript类型
```

### 2.3 后端架构

```
server/
├── src/
│   ├── routes/             # 路由定义
│   │   ├── project.ts      # 项目路由
│   │   ├── storyboard.ts   # 分镜路由
│   │   ├── resource.ts     # 资源路由
│   │   ├── config.ts       # 配置路由
│   │   └── generation.ts   # 生成任务路由
│   ├── services/           # 业务服务
│   │   ├── project.ts      # 项目服务
│   │   ├── storyboard.ts   # 分镜服务
│   │   ├── generation/     # 生成服务
│   │   │   ├── storyboard.ts   # 分镜生成
│   │   │   ├── image.ts        # 图片生成
│   │   │   ├── video.ts        # 视频生成
│   │   │   ├── narration.ts    # 口播文案生成
│   │   │   └── speech.ts       # 语音生成
│   │   └── ai/             # AI服务适配器
│   │       ├── adapter.ts      # 适配器接口
│   │       ├── claude.ts       # Claude适配器
│   │       ├── gemini.ts       # Gemini适配器
│   │       ├── openai.ts       # OpenAI适配器
│   │       ├── volcengine.ts   # 火山引擎适配器
│   │       └── qwen.ts         # 千问适配器
│   ├── models/             # 数据模型
│   │   ├── project.ts      # 项目模型
│   │   ├── storyboard.ts   # 分镜模型
│   │   ├── resource.ts     # 资源模型
│   │   ├── config.ts       # 配置模型
│   │   └── prompt.ts       # 提示词模型
│   ├── database/           # 数据库
│   │   ├── index.ts        # 数据库连接
│   │   ├── migrations/     # 数据库迁移
│   │   └── seeds/          # 种子数据
│   ├── queue/              # 任务队列
│   │   ├── index.ts        # 队列管理
│   │   └── workers/        # 任务处理器
│   ├── utils/              # 工具函数
│   │   ├── file.ts         # 文件操作
│   │   ├── video.ts        # 视频处理
│   │   └── image.ts        # 图片处理
│   └── config/             # 配置文件
│       └── index.ts        # 系统配置
├── uploads/                # 上传文件目录
├── generated/              # 生成文件目录
└── database.sqlite         # SQLite数据库文件
```

---

## 3. 组件与接口

### 3.1 前端组件设计

#### 3.1.1 分镜编辑器组件 (StoryboardEditor)

```typescript
interface StoryboardEditorProps {
  projectId: string;
  storyboards: Storyboard[];
  onUpdate: (storyboard: Storyboard) => void;
  onRegenerate: (id: string, type: RegenerateType) => void;
}

type RegenerateType = 'all' | 'image' | 'video' | 'narration' | 'speech';
```

#### 3.1.2 9宫格展示组件 (NineGridView)

```typescript
interface NineGridViewProps {
  group: StoryboardGroup;
  onSelectStoryboard: (id: string) => void;
  onPlayVideo: (groupId: string) => void;
}

interface StoryboardGroup {
  id: string;
  index: number;
  storyboards: Storyboard[];
  mergedVideoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}
```

#### 3.1.3 资源预览组件 (ResourcePreview)

```typescript
interface ResourcePreviewProps {
  resource: Resource;
  type: 'image' | 'video' | 'audio';
  onDownload: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}
```

#### 3.1.4 AI服务配置组件 (AIServiceConfig)

```typescript
interface AIServiceConfigProps {
  serviceType: AIServiceType;
  config: AIServiceConfig;
  onSave: (config: AIServiceConfig) => void;
  onTest: () => Promise<boolean>;
}

type AIServiceType = 'claude' | 'gemini' | 'openai' | 'volcengine' | 'qwen';

interface AIServiceConfig {
  id: string;
  type: AIServiceType;
  apiKey: string;
  endpoint?: string;
  model: string;
  enabled: boolean;
  functionType: FunctionType;
}

type FunctionType = 'storyboard' | 'image' | 'narration' | 'speech' | 'video';
```

#### 3.1.5 提示词管理组件 (PromptManager)

```typescript
interface PromptManagerProps {
  functionType: FunctionType;
  prompts: Prompt[];
  activePromptId: string;
  onAdd: (prompt: Prompt) => void;
  onUpdate: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  functionType: FunctionType;
  isActive: boolean;
  variables: string[];  // 提取的变量列表
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 后端接口设计

#### 3.2.1 项目接口

```typescript
// 获取项目列表
GET /api/projects
Response: { projects: Project[], total: number }

// 创建项目
POST /api/projects
Body: { name: string, description?: string, script?: string }
Response: { project: Project }

// 获取项目详情
GET /api/projects/:id
Response: { project: Project, storyboards: Storyboard[] }

// 更新项目
PUT /api/projects/:id
Body: { name?: string, description?: string, script?: string }
Response: { project: Project }

// 删除项目
DELETE /api/projects/:id
Response: { success: boolean }
```

#### 3.2.2 分镜接口

```typescript
// 获取分镜列表
GET /api/projects/:projectId/storyboards
Response: { storyboards: Storyboard[], groups: StoryboardGroup[] }

// 生成分镜
POST /api/projects/:projectId/storyboards/generate
Body: { regenerate?: boolean }
Response: { taskId: string }

// 更新分镜
PUT /api/storyboards/:id
Body: { sceneDescription?: string, visualDescription?: string, duration?: number, narration?: string }
Response: { storyboard: Storyboard }

// 调整分镜顺序
POST /api/projects/:projectId/storyboards/reorder
Body: { storyboardIds: string[] }
Response: { storyboards: Storyboard[] }
```

#### 3.2.3 生成任务接口

```typescript
// 生成分镜图片
POST /api/storyboards/:id/generate/image
Body: { regenerate?: boolean }
Response: { taskId: string }

// 生成分镜视频
POST /api/storyboards/:id/generate/video
Body: { regenerate?: boolean }
Response: { taskId: string }

// 生成口播文案
POST /api/projects/:projectId/generate/narration
Body: { regenerate?: boolean }
Response: { taskId: string }

// 拆分口播文案
POST /api/projects/:projectId/narration/split
Response: { storyboards: Storyboard[] }

// 生成语音
POST /api/storyboards/:id/generate/speech
Body: { voiceId?: string, speed?: number, regenerate?: boolean }
Response: { taskId: string }

// 合并视频
POST /api/projects/:projectId/merge-video
Body: { storyboardIds?: string[] }
Response: { taskId: string }

// 批量生成
POST /api/projects/:projectId/generate/batch
Body: { types: RegenerateType[], storyboardIds?: string[] }
Response: { taskIds: string[] }

// 获取任务状态
GET /api/tasks/:taskId
Response: { task: Task }

// 获取项目所有任务
GET /api/projects/:projectId/tasks
Response: { tasks: Task[] }
```

#### 3.2.4 配置接口

```typescript
// 获取AI服务配置列表
GET /api/config/ai-services
Response: { services: AIServiceConfig[] }

// 保存AI服务配置
POST /api/config/ai-services
Body: AIServiceConfig
Response: { service: AIServiceConfig }

// 测试AI服务连接
POST /api/config/ai-services/:id/test
Response: { success: boolean, message?: string }

// 启用AI服务
POST /api/config/ai-services/:id/enable
Response: { service: AIServiceConfig }

// 获取提示词列表
GET /api/config/prompts
Query: { functionType?: FunctionType }
Response: { prompts: Prompt[] }

// 创建提示词
POST /api/config/prompts
Body: { name: string, content: string, functionType: FunctionType }
Response: { prompt: Prompt }

// 更新提示词
PUT /api/config/prompts/:id
Body: { name?: string, content?: string }
Response: { prompt: Prompt }

// 激活提示词
POST /api/config/prompts/:id/activate
Response: { prompt: Prompt }

// 删除提示词
DELETE /api/config/prompts/:id
Response: { success: boolean }
```

#### 3.2.5 资源接口

```typescript
// 获取资源列表
GET /api/resources
Query: { projectId?: string, type?: ResourceType, storyboardId?: string }
Response: { resources: Resource[] }

// 上传资源
POST /api/resources/upload
Body: FormData { file: File, type: ResourceType, storyboardId?: string }
Response: { resource: Resource }

// 下载资源
GET /api/resources/:id/download
Response: File

// 删除资源
DELETE /api/resources/:id
Response: { success: boolean }

// 批量下载
POST /api/resources/batch-download
Body: { resourceIds: string[] }
Response: File (zip)
```

---

## 4. 数据模型

### 4.1 SQLite数据库表设计

```sql
-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  script TEXT,
  status TEXT DEFAULT 'draft',  -- draft, processing, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 分镜表
CREATE TABLE storyboards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  scene_description TEXT,
  visual_description TEXT,
  duration INTEGER DEFAULT 3000,  -- 毫秒
  narration TEXT,
  group_index INTEGER,  -- 9宫格分组索引
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 资源表
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- image, video, audio
  subtype TEXT,  -- first_frame, last_frame, merged, speech
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storyboard_id TEXT,
  project_id TEXT,
  metadata TEXT,  -- JSON格式的额外信息
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 分镜资源关联表
CREATE TABLE storyboard_resources (
  id TEXT PRIMARY KEY,
  storyboard_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  resource_role TEXT NOT NULL,  -- first_frame, last_frame, video, speech
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE(storyboard_id, resource_role)
);

-- AI服务配置表
CREATE TABLE ai_service_configs (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,  -- claude, gemini, openai, volcengine, qwen
  function_type TEXT NOT NULL,  -- storyboard, image, narration, speech, video
  api_key TEXT NOT NULL,
  endpoint TEXT,
  model TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 0,
  extra_config TEXT,  -- JSON格式的额外配置
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_type, function_type)
);

-- 提示词表
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  function_type TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  variables TEXT,  -- JSON数组，提取的变量
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 生成任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- storyboard, image, video, narration, speech, merge
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  project_id TEXT,
  storyboard_id TEXT,
  progress INTEGER DEFAULT 0,
  result TEXT,  -- JSON格式的结果
  error TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE SET NULL
);

-- 生成历史表（用于版本对比）
CREATE TABLE generation_history (
  id TEXT PRIMARY KEY,
  storyboard_id TEXT NOT NULL,
  type TEXT NOT NULL,  -- image, video, narration, speech
  resource_id TEXT,
  prompt_id TEXT,
  ai_service_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_storyboards_project ON storyboards(project_id);
CREATE INDEX idx_storyboards_sequence ON storyboards(project_id, sequence);
CREATE INDEX idx_resources_storyboard ON resources(storyboard_id);
CREATE INDEX idx_resources_project ON resources(project_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_prompts_function ON prompts(function_type);
CREATE INDEX idx_ai_configs_function ON ai_service_configs(function_type);
```

### 4.2 TypeScript类型定义

```typescript
// types/index.ts

export interface Project {
  id: string;
  name: string;
  description?: string;
  script?: string;
  status: 'draft' | 'processing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Storyboard {
  id: string;
  projectId: string;
  sequence: number;
  sceneDescription?: string;
  visualDescription?: string;
  duration: number;  // 毫秒
  narration?: string;
  groupIndex?: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  videoUrl?: string;
  speechUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryboardGroup {
  id: string;
  index: number;
  storyboards: Storyboard[];
  mergedVideoId?: string;
  mergedVideoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface Resource {
  id: string;
  type: 'image' | 'video' | 'audio';
  subtype?: 'first_frame' | 'last_frame' | 'merged' | 'speech';
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  storyboardId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AIServiceConfig {
  id: string;
  serviceType: 'claude' | 'gemini' | 'openai' | 'volcengine' | 'qwen';
  functionType: 'storyboard' | 'image' | 'narration' | 'speech' | 'video';
  apiKey: string;
  endpoint?: string;
  model: string;
  isEnabled: boolean;
  extraConfig?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  functionType: 'storyboard' | 'image' | 'narration' | 'speech' | 'video';
  isActive: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  type: 'storyboard' | 'image' | 'video' | 'narration' | 'speech' | 'merge';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  projectId?: string;
  storyboardId?: string;
  progress: number;
  result?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface GenerationHistory {
  id: string;
  storyboardId: string;
  type: 'image' | 'video' | 'narration' | 'speech';
  resourceId?: string;
  promptId?: string;
  aiServiceId?: string;
  createdAt: Date;
}
```

---

## 5. 核心流程设计

### 5.1 分镜生成流程

```
用户输入文案
    │
    ▼
获取生效的分镜生成提示词
    │
    ▼
获取生效的AI服务配置
    │
    ▼
调用AI服务生成分镜JSON
    │
    ▼
解析分镜数据（场景、画面、时长）
    │
    ▼
自动补齐至9的倍数（可选）
    │
    ▼
保存分镜到数据库
    │
    ▼
自动分组（每9个一组）
    │
    ▼
返回分镜列表
```

### 5.2 图片生成流程

```
获取分镜信息
    │
    ▼
检查是否为第一个分镜
    │
    ├── 是 → 生成独立首帧
    │
    └── 否 → 获取上一个分镜的尾帧作为首帧
    │
    ▼
获取生效的图片生成提示词
    │
    ▼
调用AI图片服务生成尾帧
    │
    ▼
保存图片资源
    │
    ▼
更新分镜资源关联
    │
    ▼
触发下一个分镜的首帧更新（如果存在）
```

### 5.3 视频生成流程

```
获取分镜及关联的首帧、尾帧
    │
    ▼
验证资源完整性
    │
    ├── 不完整 → 返回错误，提示缺失资源
    │
    └── 完整 → 继续
    │
    ▼
调用视频生成服务（图生视频）
    │
    ▼
等待生成完成
    │
    ▼
保存视频资源
    │
    ▼
更新分镜状态
```

### 5.4 视频合并流程

```
获取分组内所有分镜视频
    │
    ▼
按序号排序
    │
    ▼
验证所有视频就绪
    │
    ├── 有缺失 → 返回缺失列表
    │
    └── 完整 → 继续
    │
    ▼
使用FFmpeg合并视频
    │
    ▼
保存合并后的视频
    │
    ▼
更新分组状态
```

### 5.5 语音生成流程

```
获取分镜的口播文案
    │
    ▼
获取TTS服务配置
    │
    ▼
调用TTS服务生成语音
    │
    ▼
保存语音文件
    │
    ▼
更新分镜资源关联
```

---

## 6. AI服务适配器设计

### 6.1 适配器接口

```typescript
// 基础适配器接口
interface AIAdapter {
  type: AIServiceType;
  config: AIServiceConfig;

  // 测试连接
  testConnection(): Promise<boolean>;
}

// 文本生成适配器
interface TextGenerationAdapter extends AIAdapter {
  generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
}

// 图片生成适配器
interface ImageGenerationAdapter extends AIAdapter {
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string>;
}

// 语音合成适配器
interface SpeechSynthesisAdapter extends AIAdapter {
  synthesizeSpeech(text: string, options?: SpeechOptions): Promise<Buffer>;
}

// 视频生成适配器
interface VideoGenerationAdapter extends AIAdapter {
  generateVideo(
    firstFrame: string,
    lastFrame: string,
    options?: VideoGenerationOptions
  ): Promise<string>;
}
```

### 6.2 工厂模式创建适配器

```typescript
class AIAdapterFactory {
  static createTextAdapter(config: AIServiceConfig): TextGenerationAdapter {
    switch (config.serviceType) {
      case 'claude':
        return new ClaudeAdapter(config);
      case 'gemini':
        return new GeminiAdapter(config);
      case 'openai':
        return new OpenAIAdapter(config);
      case 'qwen':
        return new QwenAdapter(config);
      default:
        throw new Error(`Unsupported service type: ${config.serviceType}`);
    }
  }

  static createImageAdapter(config: AIServiceConfig): ImageGenerationAdapter {
    // 根据配置创建对应的图片生成适配器
  }

  static createSpeechAdapter(config: AIServiceConfig): SpeechSynthesisAdapter {
    // 根据配置创建对应的语音合成适配器
  }

  static createVideoAdapter(config: AIServiceConfig): VideoGenerationAdapter {
    // 根据配置创建对应的视频生成适配器
  }
}
```

---

## 7. 错误处理

### 7.1 错误类型定义

```typescript
enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',

  // AI服务错误
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  AI_SERVICE_RATE_LIMITED = 'AI_SERVICE_RATE_LIMITED',
  AI_SERVICE_QUOTA_EXCEEDED = 'AI_SERVICE_QUOTA_EXCEEDED',
  AI_SERVICE_INVALID_RESPONSE = 'AI_SERVICE_INVALID_RESPONSE',

  // 资源错误
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_GENERATION_FAILED = 'RESOURCE_GENERATION_FAILED',
  RESOURCE_UPLOAD_FAILED = 'RESOURCE_UPLOAD_FAILED',

  // 任务错误
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_ALREADY_PROCESSING = 'TASK_ALREADY_PROCESSING',
  TASK_DEPENDENCY_MISSING = 'TASK_DEPENDENCY_MISSING',

  // 配置错误
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}
```

### 7.2 错误处理中间件

```typescript
// Express错误处理中间件
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(getHttpStatus(err.code)).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 未知错误
  console.error('Unexpected error:', err);
  return res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  });
}
```

### 7.3 重试机制

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await sleep(waitTime);
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## 8. 测试策略

### 8.1 单元测试

- **范围**: 工具函数、数据模型、适配器逻辑
- **框架**: Vitest（前端）、Jest（后端）
- **覆盖率目标**: 80%以上

```typescript
// 示例：提示词变量提取测试
describe('extractVariables', () => {
  it('should extract variables from prompt template', () => {
    const template = '根据{文案}生成{分镜数量}个分镜';
    const variables = extractVariables(template);
    expect(variables).toEqual(['文案', '分镜数量']);
  });
});
```

### 8.2 集成测试

- **范围**: API接口、数据库操作、服务层
- **框架**: Supertest
- **重点**: CRUD操作、任务流程、资源管理

```typescript
// 示例：项目创建API测试
describe('POST /api/projects', () => {
  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project', script: 'Test script' });

    expect(response.status).toBe(201);
    expect(response.body.project).toHaveProperty('id');
  });
});
```

### 8.3 端到端测试

- **范围**: 核心用户流程
- **框架**: Playwright
- **重点场景**:
  - 创建项目 → 输入文案 → 生成分镜 → 查看9宫格
  - 配置AI服务 → 测试连接 → 保存配置
  - 生成图片 → 生成视频 → 合并视频

### 8.4 Mock策略

```typescript
// AI服务Mock
class MockAIAdapter implements TextGenerationAdapter {
  async generateText(prompt: string): Promise<string> {
    return JSON.stringify([
      { scene: 'Scene 1', visual: 'Visual 1', duration: 3000 },
      { scene: 'Scene 2', visual: 'Visual 2', duration: 3000 },
    ]);
  }
}
```

---

## 9. 部署架构

### 9.1 Nginx配置

```nginx
server {
    listen 80;
    server_name localhost;

    # 前端静态资源
    location / {
        root /var/www/9cut/dist;
        try_files $uri $uri/ /index.html;

        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 超时配置（AI服务可能需要较长时间）
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # 生成资源访问
    location /generated/ {
        alias /var/www/9cut/server/generated/;
        expires 1d;
    }

    # 上传资源访问
    location /uploads/ {
        alias /var/www/9cut/server/uploads/;
        expires 1d;
    }
}
```

### 9.2 目录结构

```
/var/www/9cut/
├── dist/               # 前端构建产物
├── server/
│   ├── dist/           # 后端构建产物
│   ├── uploads/        # 上传文件
│   ├── generated/      # 生成文件
│   │   ├── images/
│   │   ├── videos/
│   │   └── audio/
│   └── database.sqlite
└── logs/
    ├── access.log
    └── error.log
```

---

## 10. 环境变量配置

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库
DATABASE_PATH=./database.sqlite

# 文件存储
UPLOAD_DIR=./uploads
GENERATED_DIR=./generated
MAX_FILE_SIZE=100MB

# AI服务（默认配置，可通过界面覆盖）
DEFAULT_AI_SERVICE=openai

# 视频处理
FFMPEG_PATH=/usr/bin/ffmpeg

# 安全
API_KEY_ENCRYPTION_SECRET=your-secret-key

# 日志
LOG_LEVEL=info
LOG_DIR=./logs
```
