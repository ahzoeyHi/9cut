import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import type { Storyboard, StoryboardWithResources, StoryboardStatus, StoryboardGroup } from '../types';

export interface CreateStoryboardData {
  project_id: string;
  sequence: number;
  scene_description?: string;
  visual_description?: string;
  duration?: number;
  narration?: string;
}

export interface UpdateStoryboardData {
  scene_description?: string;
  visual_description?: string;
  duration?: number;
  narration?: string;
  status?: StoryboardStatus;
  group_index?: number;
}

export const storyboardModel = {
  findByProjectId(projectId: string): StoryboardWithResources[] {
    const stmt = db.prepare(`
      SELECT
        s.*,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'first_frame') as first_frame_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'last_frame') as last_frame_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'video') as video_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'speech') as speech_url
      FROM storyboards s
      WHERE s.project_id = ?
      ORDER BY s.sequence ASC
    `);
    return stmt.all(projectId) as StoryboardWithResources[];
  },

  findById(id: string): StoryboardWithResources | undefined {
    const stmt = db.prepare(`
      SELECT
        s.*,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'first_frame') as first_frame_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'last_frame') as last_frame_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'video') as video_url,
        (SELECT r.file_path FROM resources r
         JOIN storyboard_resources sr ON r.id = sr.resource_id
         WHERE sr.storyboard_id = s.id AND sr.resource_role = 'speech') as speech_url
      FROM storyboards s
      WHERE s.id = ?
    `);
    return stmt.get(id) as StoryboardWithResources | undefined;
  },

  create(data: CreateStoryboardData): Storyboard {
    const id = uuidv4();
    const now = new Date().toISOString();
    const groupIndex = Math.floor(data.sequence / 9);

    const stmt = db.prepare(`
      INSERT INTO storyboards (id, project_id, sequence, scene_description, visual_description, duration, narration, group_index, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    stmt.run(
      id,
      data.project_id,
      data.sequence,
      data.scene_description || null,
      data.visual_description || null,
      data.duration || 3000,
      data.narration || null,
      groupIndex,
      now,
      now
    );

    return this.findById(id)! as Storyboard;
  },

  createBatch(storyboards: CreateStoryboardData[]): Storyboard[] {
    const insertStmt = db.prepare(`
      INSERT INTO storyboards (id, project_id, sequence, scene_description, visual_description, duration, narration, group_index, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);

    const now = new Date().toISOString();
    const results: Storyboard[] = [];

    const insertMany = db.transaction((items: CreateStoryboardData[]) => {
      for (const data of items) {
        const id = uuidv4();
        const groupIndex = Math.floor(data.sequence / 9);
        insertStmt.run(
          id,
          data.project_id,
          data.sequence,
          data.scene_description || null,
          data.visual_description || null,
          data.duration || 3000,
          data.narration || null,
          groupIndex,
          now,
          now
        );
        results.push(this.findById(id)! as Storyboard);
      }
    });

    insertMany(storyboards);
    return results;
  },

  update(id: string, data: UpdateStoryboardData): Storyboard | undefined {
    const storyboard = this.findById(id);
    if (!storyboard) return undefined;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.scene_description !== undefined) {
      updates.push('scene_description = ?');
      values.push(data.scene_description);
    }
    if (data.visual_description !== undefined) {
      updates.push('visual_description = ?');
      values.push(data.visual_description);
    }
    if (data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(data.duration);
    }
    if (data.narration !== undefined) {
      updates.push('narration = ?');
      values.push(data.narration);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.group_index !== undefined) {
      updates.push('group_index = ?');
      values.push(data.group_index);
    }

    if (updates.length === 0) return storyboard as Storyboard;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE storyboards SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id) as Storyboard;
  },

  updateSequences(projectId: string, storyboardIds: string[]): Storyboard[] {
    const updateStmt = db.prepare(`
      UPDATE storyboards SET sequence = ?, group_index = ?, updated_at = ? WHERE id = ?
    `);

    const now = new Date().toISOString();

    const updateMany = db.transaction((ids: string[]) => {
      ids.forEach((id, index) => {
        const groupIndex = Math.floor(index / 9);
        updateStmt.run(index, groupIndex, now, id);
      });
    });

    updateMany(storyboardIds);
    return this.findByProjectId(projectId);
  },

  deleteByProjectId(projectId: string): number {
    const stmt = db.prepare('DELETE FROM storyboards WHERE project_id = ?');
    const result = stmt.run(projectId);
    return result.changes;
  },

  delete(id: string): boolean {
    const stmt = db.prepare('DELETE FROM storyboards WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  getGroups(projectId: string): StoryboardGroup[] {
    const storyboards = this.findByProjectId(projectId);
    const groups: StoryboardGroup[] = [];

    for (let i = 0; i < storyboards.length; i += 9) {
      const groupStoryboards = storyboards.slice(i, i + 9);
      const groupIndex = Math.floor(i / 9);

      // 计算分组状态
      let status: StoryboardGroup['status'] = 'pending';
      if (groupStoryboards.some(s => s.status === 'error')) {
        status = 'error';
      } else if (groupStoryboards.some(s => s.status === 'generating')) {
        status = 'processing';
      } else if (groupStoryboards.every(s => s.status === 'completed')) {
        status = 'completed';
      }

      groups.push({
        id: `group-${groupIndex}`,
        index: groupIndex,
        storyboards: groupStoryboards,
        status
      });
    }

    return groups;
  }
};
