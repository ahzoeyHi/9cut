"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptMessageModel = exports.scriptSessionModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
exports.scriptSessionModel = {
    // 创建会话
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO script_sessions (id, project_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `);
        stmt.run(id, data.project_id, data.title || '新口播稿', now, now);
        return this.findById(id);
    },
    // 根据ID查找会话
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM script_sessions WHERE id = ?');
        return stmt.get(id);
    },
    // 根据项目ID查找所有会话
    findByProjectId(projectId) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM script_sessions
      WHERE project_id = ?
      ORDER BY updated_at DESC
    `);
        return stmt.all(projectId);
    },
    // 更新会话
    update(id, data) {
        const session = this.findById(id);
        if (!session)
            return null;
        const updates = [];
        const values = [];
        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.current_script !== undefined) {
            updates.push('current_script = ?');
            values.push(data.current_script);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);
        const stmt = database_1.default.prepare(`
      UPDATE script_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
        stmt.run(...values);
        return this.findById(id);
    },
    // 删除会话
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM script_sessions WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    },
    // 获取会话及其所有消息
    findWithMessages(id) {
        const session = this.findById(id);
        if (!session)
            return null;
        const messages = exports.scriptMessageModel.findBySessionId(id);
        return {
            ...session,
            messages
        };
    }
};
exports.scriptMessageModel = {
    // 创建消息
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO script_messages (id, session_id, role, content, script_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, data.session_id, data.role, data.content, data.script_version || null, now);
        // 更新会话的更新时间
        database_1.default.prepare('UPDATE script_sessions SET updated_at = ? WHERE id = ?')
            .run(now, data.session_id);
        return this.findById(id);
    },
    // 根据ID查找消息
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM script_messages WHERE id = ?');
        return stmt.get(id);
    },
    // 根据会话ID查找所有消息
    findBySessionId(sessionId) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM script_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `);
        return stmt.all(sessionId);
    },
    // 删除消息
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM script_messages WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
};
//# sourceMappingURL=scriptSession.js.map