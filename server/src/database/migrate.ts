import db from './index';

const migrations = [
  // 项目表
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    script TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 分镜表
  `CREATE TABLE IF NOT EXISTS storyboards (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    scene_description TEXT,
    visual_description TEXT,
    duration INTEGER DEFAULT 3000,
    narration TEXT,
    group_index INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,

  // 资源表
  `CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storyboard_id TEXT,
    project_id TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,

  // 分镜资源关联表
  `CREATE TABLE IF NOT EXISTS storyboard_resources (
    id TEXT PRIMARY KEY,
    storyboard_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(storyboard_id, resource_role)
  )`,

  // AI服务配置表
  `CREATE TABLE IF NOT EXISTS ai_service_configs (
    id TEXT PRIMARY KEY,
    service_type TEXT NOT NULL,
    function_type TEXT NOT NULL,
    api_key TEXT NOT NULL,
    endpoint TEXT,
    model TEXT NOT NULL,
    is_enabled INTEGER DEFAULT 0,
    extra_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_type, function_type)
  )`,

  // 提示词表
  `CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    function_type TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    variables TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 生成任务表
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    project_id TEXT,
    storyboard_id TEXT,
    progress INTEGER DEFAULT 0,
    result TEXT,
    error TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE SET NULL
  )`,

  // 生成历史表
  `CREATE TABLE IF NOT EXISTS generation_history (
    id TEXT PRIMARY KEY,
    storyboard_id TEXT NOT NULL,
    type TEXT NOT NULL,
    resource_id TEXT,
    prompt_id TEXT,
    ai_service_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
  )`,

  // 索引
  `CREATE INDEX IF NOT EXISTS idx_storyboards_project ON storyboards(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_storyboards_sequence ON storyboards(project_id, sequence)`,
  `CREATE INDEX IF NOT EXISTS idx_resources_storyboard ON resources(storyboard_id)`,
  `CREATE INDEX IF NOT EXISTS idx_resources_project ON resources(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_prompts_function ON prompts(function_type)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_configs_function ON ai_service_configs(function_type)`
];

export function runMigrations(): void {
  console.log('Running database migrations...');

  for (const migration of migrations) {
    try {
      db.exec(migration);
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }

  console.log('Database migrations completed successfully.');
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  runMigrations();
}
