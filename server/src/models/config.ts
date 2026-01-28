import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { AIServiceConfig, AIServiceType, FunctionType } from '../types';

export interface CreateAIServiceConfigData {
  service_type: AIServiceType;
  function_type: FunctionType;
  api_key: string;
  endpoint?: string;
  model: string;
  is_enabled?: boolean;
  extra_config?: Record<string, unknown>;
}

export interface UpdateAIServiceConfigData {
  api_key?: string;
  endpoint?: string;
  model?: string;
  is_enabled?: boolean;
  extra_config?: Record<string, unknown>;
}

export const aiServiceConfigModel = {
  findAll(): AIServiceConfig[] {
    const stmt = db.prepare('SELECT * FROM ai_service_configs ORDER BY function_type, service_type');
    return stmt.all() as AIServiceConfig[];
  },

  findById(id: string): AIServiceConfig | undefined {
    const stmt = db.prepare('SELECT * FROM ai_service_configs WHERE id = ?');
    return stmt.get(id) as AIServiceConfig | undefined;
  },

  findByFunction(functionType: FunctionType): AIServiceConfig[] {
    const stmt = db.prepare('SELECT * FROM ai_service_configs WHERE function_type = ?');
    return stmt.all(functionType) as AIServiceConfig[];
  },

  findActiveByFunction(functionType: FunctionType): AIServiceConfig | undefined {
    const stmt = db.prepare('SELECT * FROM ai_service_configs WHERE function_type = ? AND is_enabled = 1');
    return stmt.get(functionType) as AIServiceConfig | undefined;
  },

  create(data: CreateAIServiceConfigData): AIServiceConfig {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ai_service_configs (id, service_type, function_type, api_key, endpoint, model, is_enabled, extra_config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.service_type,
      data.function_type,
      data.api_key,
      data.endpoint || null,
      data.model,
      data.is_enabled ? 1 : 0,
      data.extra_config ? JSON.stringify(data.extra_config) : null,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: UpdateAIServiceConfigData): AIServiceConfig | undefined {
    const config = this.findById(id);
    if (!config) return undefined;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.api_key !== undefined) {
      updates.push('api_key = ?');
      values.push(data.api_key);
    }
    if (data.endpoint !== undefined) {
      updates.push('endpoint = ?');
      values.push(data.endpoint);
    }
    if (data.model !== undefined) {
      updates.push('model = ?');
      values.push(data.model);
    }
    if (data.is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      values.push(data.is_enabled ? 1 : 0);
    }
    if (data.extra_config !== undefined) {
      updates.push('extra_config = ?');
      values.push(JSON.stringify(data.extra_config));
    }

    if (updates.length === 0) return config;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE ai_service_configs SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  },

  enable(id: string): AIServiceConfig | undefined {
    const config = this.findById(id);
    if (!config) return undefined;

    // 先禁用同类型的其他服务
    const disableStmt = db.prepare(`
      UPDATE ai_service_configs SET is_enabled = 0, updated_at = ? WHERE function_type = ?
    `);
    disableStmt.run(new Date().toISOString(), config.function_type);

    // 启用当前服务
    return this.update(id, { is_enabled: true });
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM ai_service_configs WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
