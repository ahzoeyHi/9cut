// 项目状态
export type ProjectStatus = 'draft' | 'processing' | 'completed';

// 分镜状态
export type StoryboardStatus = 'pending' | 'generating' | 'completed' | 'error';

// AI服务类型
export type AIServiceType = 'claude' | 'gemini' | 'openai' | 'volcengine' | 'qwen' | 'kimi' | 'glm' | 'deepseek' | 'grok';

// 功能类型
export type FunctionType = 'storyboard' | 'image' | 'narration' | 'speech' | 'video';

// 资源类型
export type ResourceType = 'image' | 'video' | 'audio';

// 资源子类型
export type ResourceSubtype = 'first_frame' | 'last_frame' | 'merged' | 'speech';

// 任务类型
export type TaskType = 'storyboard' | 'image' | 'video' | 'narration' | 'speech' | 'merge';

// 任务状态
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// 重新生成类型
export type RegenerateType = 'all' | 'image' | 'video' | 'narration' | 'speech';

// 项目
export interface Project {
  id: string;
  name: string;
  description?: string;
  script?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// 分镜
export interface Storyboard {
  id: string;
  projectId: string;
  sequence: number;
  sceneDescription?: string;
  visualDescription?: string;
  duration: number;
  narration?: string;
  groupIndex?: number;
  status: StoryboardStatus;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  videoUrl?: string;
  speechUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 分镜组
export interface StoryboardGroup {
  id: string;
  index: number;
  storyboards: Storyboard[];
  mergedVideoId?: string;
  mergedVideoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

// 资源
export interface Resource {
  id: string;
  type: ResourceType;
  subtype?: ResourceSubtype;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  storyboardId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// AI服务配置
export interface AIServiceConfig {
  id: string;
  serviceType: AIServiceType;
  functionType: FunctionType;
  apiKey: string;
  endpoint?: string;
  model: string;
  isEnabled: boolean;
  extraConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// 提示词
export interface Prompt {
  id: string;
  name: string;
  content: string;
  functionType: FunctionType;
  isActive: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

// 任务
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  projectId?: string;
  storyboardId?: string;
  progress: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 模型能力类型
export type ModelCapability = 'text' | 'image' | 'speech' | 'video' | 'embedding';

// 模型信息
export interface ModelInfo {
  id: string;
  name: string;
  capabilities: ModelCapability[];
  description?: string;
}
