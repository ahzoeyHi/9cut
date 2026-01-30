"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
exports.resourceModel = {
    findAll(filters) {
        let sql = 'SELECT * FROM resources WHERE 1=1';
        const params = [];
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
        const stmt = database_1.default.prepare(sql);
        return stmt.all(...params);
    },
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM resources WHERE id = ?');
        return stmt.get(id);
    },
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO resources (id, type, subtype, file_path, file_size, mime_type, storyboard_id, project_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, data.type, data.subtype || null, data.file_path, data.file_size || null, data.mime_type || null, data.storyboard_id || null, data.project_id || null, data.metadata ? JSON.stringify(data.metadata) : null, now);
        return this.findById(id);
    },
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM resources WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    },
    deleteByProjectId(projectId) {
        const stmt = database_1.default.prepare('DELETE FROM resources WHERE project_id = ?');
        const result = stmt.run(projectId);
        return result.changes;
    },
    // 关联资源到分镜
    linkToStoryboard(storyboardId, resourceId, role) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // 使用 INSERT OR REPLACE 来处理唯一约束
        const stmt = database_1.default.prepare(`
      INSERT OR REPLACE INTO storyboard_resources (id, storyboard_id, resource_id, resource_role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(id, storyboardId, resourceId, role, now);
    },
    // 取消关联
    unlinkFromStoryboard(storyboardId, role) {
        const stmt = database_1.default.prepare(`
      DELETE FROM storyboard_resources
      WHERE storyboard_id = ? AND resource_role = ?
    `);
        stmt.run(storyboardId, role);
    }
};
//# sourceMappingURL=resource.js.map