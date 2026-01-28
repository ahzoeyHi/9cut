import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Prompt, FunctionType } from '../types';

export interface CreatePromptData {
  name: string;
  content: string;
  function_type: FunctionType;
}

export interface UpdatePromptData {
  name?: string;
  content?: string;
}

// 从模板内容中提取变量
function extractVariables(content: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

export const promptModel = {
  findAll(functionType?: FunctionType): Prompt[] {
    let sql = 'SELECT * FROM prompts';
    const params: string[] = [];

    if (functionType) {
      sql += ' WHERE function_type = ?';
      params.push(functionType);
    }

    sql += ' ORDER BY function_type, created_at DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Prompt[];
  },

  findById(id: string): Prompt | undefined {
    const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?');
    return stmt.get(id) as Prompt | undefined;
  },

  findActiveByFunction(functionType: FunctionType): Prompt | undefined {
    const stmt = db.prepare('SELECT * FROM prompts WHERE function_type = ? AND is_active = 1');
    return stmt.get(functionType) as Prompt | undefined;
  },

  create(data: CreatePromptData): Prompt {
    const id = uuidv4();
    const now = new Date().toISOString();
    const variables = extractVariables(data.content);

    const stmt = db.prepare(`
      INSERT INTO prompts (id, name, content, function_type, is_active, variables, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.content,
      data.function_type,
      JSON.stringify(variables),
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: UpdatePromptData): Prompt | undefined {
    const prompt = this.findById(id);
    if (!prompt) return undefined;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.content !== undefined) {
      updates.push('content = ?');
      values.push(data.content);
      // 更新变量列表
      const variables = extractVariables(data.content);
      updates.push('variables = ?');
      values.push(JSON.stringify(variables));
    }

    if (updates.length === 0) return prompt;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE prompts SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  },

  activate(id: string): Prompt | undefined {
    const prompt = this.findById(id);
    if (!prompt) return undefined;

    // 先停用同类型的其他提示词
    const deactivateStmt = db.prepare(`
      UPDATE prompts SET is_active = 0, updated_at = ? WHERE function_type = ?
    `);
    deactivateStmt.run(new Date().toISOString(), prompt.function_type);

    // 激活当前提示词
    const activateStmt = db.prepare(`
      UPDATE prompts SET is_active = 1, updated_at = ? WHERE id = ?
    `);
    activateStmt.run(new Date().toISOString(), id);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
