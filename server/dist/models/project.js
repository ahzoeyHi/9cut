"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
exports.projectModel = {
    findAll() {
        const stmt = database_1.default.prepare(`
      SELECT * FROM projects
      ORDER BY updated_at DESC
    `);
        return stmt.all();
    },
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM projects WHERE id = ?');
        return stmt.get(id);
    },
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO projects (id, name, description, script, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'draft', ?, ?)
    `);
        stmt.run(id, data.name, data.description || null, data.script || null, now, now);
        return this.findById(id);
    },
    update(id, data) {
        const project = this.findById(id);
        if (!project)
            return undefined;
        const updates = [];
        const values = [];
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
        if (updates.length === 0)
            return project;
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);
        const stmt = database_1.default.prepare(`
      UPDATE projects SET ${updates.join(', ')} WHERE id = ?
    `);
        stmt.run(...values);
        return this.findById(id);
    },
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM projects WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    },
    count() {
        const stmt = database_1.default.prepare('SELECT COUNT(*) as count FROM projects');
        const result = stmt.get();
        return result.count;
    }
};
//# sourceMappingURL=project.js.map