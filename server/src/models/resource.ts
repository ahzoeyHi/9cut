import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Resource, ResourceType, ResourceSubtype } from '../types';

export interface CreateResourceData {
  type: ResourceType;
  subtype?: ResourceSubtype;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  storyboard_id?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
}

export const resourceModel = {
  findAll(filters?: { projectId?: string; storyboardId?: string; type?: ResourceType }): Resource[] {
    let sql = 'SELECT * FROM resources WHERE 1=1';
    const params: (string)[] = [];

    if (filters?.projectId) {
      sql += ' AND project_id = ?';
      params.push(filters.projectId);
    }
    if (filters?.storyboardId) {
      sql += ' AND storyboard_id = ?';
      params.push(filters.storyboardId);
    }
    if (filters?.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Resource[];
  },

  findById(id: string): Resource | undefined {
    const stmt = db.prepare('SELECT * FROM resources WHERE id = ?');
    return stmt.get(id) as Resource | undefined;
  },

  create(data: CreateResourceData): Resource {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO resources (id, type, subtype, file_path, file_size, mime_type, storyboard_id, project_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.type,
      data.subtype || null,
      data.file_path,
      data.file_size || null,
      data.mime_type || null,
      data.storyboard_id || null,
      data.project_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now
    );

    return this.findById(id)!;
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM resources WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteByProjectId(projectId: string): number {
    const stmt = db.prepare('DELETE FROM resources WHERE project_id = ?');
    const result = stmt.run(projectId);
    return result.changes;
  },

  // 关联资源到分镜
  linkToStoryboard(storyboardId: string, resourceId: string, role: 'first_frame' | 'last_frame' | 'video' | 'speech'): void {
    const id = uuidv4();
    const now = new Date().toISOString();

    // 使用 INSERT OR REPLACE 来处理唯一约束
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO storyboard_resources (id, storyboard_id, resource_id, resource_role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, storyboardId, resourceId, role, now);
  },

  // 取消关联
  unlinkFromStoryboard(storyboardId: string, role: 'first_frame' | 'last_frame' | 'video' | 'speech'): void {
    const stmt = db.prepare(`
      DELETE FROM storyboard_resources
      WHERE storyboard_id = ? AND resource_role = ?
    `);
    stmt.run(storyboardId, role);
  }
};
