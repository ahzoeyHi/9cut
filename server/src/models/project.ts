import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectStatus } from '../types';

export interface CreateProjectData {
  name: string;
  description?: string;
  script?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  script?: string;
  status?: ProjectStatus;
}

export const projectModel = {
  findAll(): Project[] {
    const stmt = db.prepare(`
      SELECT * FROM projects
      ORDER BY updated_at DESC
    `);
    return stmt.all() as Project[];
  },

  findById(id: string): Project | undefined {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id) as Project | undefined;
  },

  create(data: CreateProjectData): Project {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, script, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, ?)
    `);

    stmt.run(id, data.name, data.description || null, data.script || null, now, now);

    return this.findById(id)!;
  },

  update(id: string, data: UpdateProjectData): Project | undefined {
    const project = this.findById(id);
    if (!project) return undefined;

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.script !== undefined) {
      updates.push('script = ?');
      values.push(data.script);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (updates.length === 0) return project;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE projects SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  count(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM projects');
    const result = stmt.get() as { count: number };
    return result.count;
  }
};
