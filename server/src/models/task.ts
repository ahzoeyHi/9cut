import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskType, TaskStatus } from '../types';

export interface CreateTaskData {
  type: TaskType;
  project_id?: string;
  storyboard_id?: string;
}

export interface UpdateTaskData {
  status?: TaskStatus;
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}

export const taskModel = {
  findById(id: string): Task | undefined {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id) as Task | undefined;
  },

  findByProjectId(projectId: string): Task[] {
    const stmt = db.prepare(`
      SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC
    `);
    return stmt.all(projectId) as Task[];
  },

  findPending(): Task[] {
    const stmt = db.prepare(`
      SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at ASC
    `);
    return stmt.all() as Task[];
  },

  findProcessing(): Task[] {
    const stmt = db.prepare(`
      SELECT * FROM tasks WHERE status = 'processing' ORDER BY created_at ASC
    `);
    return stmt.all() as Task[];
  },

  create(data: CreateTaskData): Task {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tasks (id, type, status, project_id, storyboard_id, progress, created_at)
      VALUES (?, ?, 'pending', ?, ?, 0, ?)
    `);

    stmt.run(
      id,
      data.type,
      data.project_id || null,
      data.storyboard_id || null,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: UpdateTaskData): Task | undefined {
    const task = this.findById(id);
    if (!task) return undefined;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);

      if (data.status === 'processing' && !task.started_at) {
        updates.push('started_at = ?');
        values.push(new Date().toISOString());
      }
      if (data.status === 'completed' || data.status === 'failed') {
        updates.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (data.progress !== undefined) {
      updates.push('progress = ?');
      values.push(data.progress);
    }
    if (data.result !== undefined) {
      updates.push('result = ?');
      values.push(JSON.stringify(data.result));
    }
    if (data.error !== undefined) {
      updates.push('error = ?');
      values.push(data.error);
    }

    if (updates.length === 0) return task;

    values.push(id);

    const stmt = db.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};
