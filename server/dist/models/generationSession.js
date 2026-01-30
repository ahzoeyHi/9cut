"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generationMessageModel = exports.generationSessionModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
exports.generationSessionModel = {
    // 创建会话
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO generation_sessions (id, type, project_id, storyboard_id, title, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `);
        const titleDefault = data.title || this.getDefaultTitle(data.type);
        stmt.run(id, data.type, data.project_id, data.storyboard_id || null, titleDefault, now, now);
        return this.findById(id);
    },
    getDefaultTitle(type) {
        switch (type) {
            case 'storyboard': return '分镜修改';
            case 'image': return '图片修改';
            case 'video': return '视频修改';
            case 'speech': return '语音修改';
            default: return '新会话';
        }
    },
    // 根据ID查找会话
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM generation_sessions WHERE id = ?');
        return stmt.get(id);
    },
    // 根据项目ID和类型查找会话
    findByProjectAndType(projectId, type) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM generation_sessions
      WHERE project_id = ? AND type = ?
      ORDER BY updated_at DESC
    `);
        return stmt.all(projectId, type);
    },
    // 根据分镜ID和类型查找会话
    findByStoryboardAndType(storyboardId, type) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM generation_sessions
      WHERE storyboard_id = ? AND type = ?
      ORDER BY updated_at DESC
    `);
        return stmt.all(storyboardId, type);
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
        if (data.current_result !== undefined) {
            updates.push('current_result = ?');
            values.push(data.current_result);
        }
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);
        const stmt = database_1.default.prepare(`
      UPDATE generation_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
        stmt.run(...values);
        return this.findById(id);
    },
    // 删除会话
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM generation_sessions WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    },
    // 获取会话及其所有消息
    findWithMessages(id) {
        const session = this.findById(id);
        if (!session)
            return null;
        const messages = exports.generationMessageModel.findBySessionId(id);
        return {
            ...session,
            messages
        };
    }
};
exports.generationMessageModel = {
    // 创建消息
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = database_1.default.prepare(`
      INSERT INTO generation_messages (id, session_id, role, content, result_snapshot, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, data.session_id, data.role, data.content, data.result_snapshot || null, now);
        // 更新会话的更新时间
        database_1.default.prepare('UPDATE generation_sessions SET updated_at = ? WHERE id = ?')
            .run(now, data.session_id);
        return this.findById(id);
    },
    // 根据ID查找消息
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM generation_messages WHERE id = ?');
        return stmt.get(id);
    },
    // 根据会话ID查找所有消息
    findBySessionId(sessionId) {
        const stmt = database_1.default.prepare(`
      SELECT * FROM generation_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `);
        return stmt.all(sessionId);
    },
    // 删除消息
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM generation_messages WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
};
//# sourceMappingURL=generationSession.js.map