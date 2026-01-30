"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
exports.taskModel = {
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM tasks WHERE id = ?');
        return stmt.get(id);
    },
    findByProjectId(projectId) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC
    `);
        return stmt.all(projectId);
    },
    findPending() {
        const stmt = database_1.default.prepare(`
      SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at ASC
    `);
        return stmt.all();
    },
    findProcessing() {
        const stmt = database_1.default.prepare(`
      SELECT * FROM tasks WHERE status = 'processing' ORDER BY created_at ASC
    `);
        return stmt.all();
    },
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO tasks (id, type, status, project_id, storyboard_id, progress, created_at)
      VALUES (?, ?, 'pending', ?, ?, 0, ?)
    `);
        stmt.run(id, data.type, data.project_id || null, data.storyboard_id || null, now);
        return this.findById(id);
    },
    update(id, data) {
        const task = this.findById(id);
        if (!task)
            return undefined;
        const updates = [];
        const values = [];
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
        if (updates.length === 0)
            return task;
        values.push(id);
        const stmt = database_1.default.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `);
        stmt.run(...values);
        return this.findById(id);
    },
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM tasks WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
};
//# sourceMappingURL=task.js.map