"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptModel = void 0;
const database_1 = __importDefault(require("../database"));
const uuid_1 = require("uuid");
// 从模板内容中提取变量
function extractVariables(content) {
    const regex = /\{([^}]+)\}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }
    return variables;
}
exports.promptModel = {
    findAll(functionType) {
        let sql = 'SELECT * FROM prompts';
        const params = [];
        if (functionType) {
            sql += ' WHERE function_type = ?';
            params.push(functionType);
        }
        sql += ' ORDER BY function_type, created_at DESC';
        const stmt = database_1.default.prepare(sql);
        return stmt.all(...params);
    },
    findById(id) {
        const stmt = database_1.default.prepare('SELECT * FROM prompts WHERE id = ?');
        return stmt.get(id);
    },
    findActiveByFunction(functionType) {
        const stmt = database_1.default.prepare('SELECT * FROM prompts WHERE function_type = ? AND is_active = 1');
        return stmt.get(functionType);
    },
    create(data) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const variables = extractVariables(data.content);
        const stmt = database_1.default.prepare(`
      INSERT INTO prompts (id, name, content, function_type, is_active, variables, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `);
        stmt.run(id, data.name, data.content, data.function_type, JSON.stringify(variables), now, now);
        return this.findById(id);
    },
    update(id, data) {
        const prompt = this.findById(id);
        if (!prompt)
            return undefined;
        const updates = [];
        const values = [];
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
        if (updates.length === 0)
            return prompt;
        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);
        const stmt = database_1.default.prepare(`
      UPDATE prompts SET ${updates.join(', ')} WHERE id = ?
    `);
        stmt.run(...values);
        return this.findById(id);
    },
    activate(id) {
        const prompt = this.findById(id);
        if (!prompt)
            return undefined;
        // 先停用同类型的其他提示词
        const deactivateStmt = database_1.default.prepare(`
      UPDATE prompts SET is_active = 0, updated_at = ? WHERE function_type = ?
    `);
        deactivateStmt.run(new Date().toISOString(), prompt.function_type);
        // 激活当前提示词
        const activateStmt = database_1.default.prepare(`
      UPDATE prompts SET is_active = 1, updated_at = ? WHERE id = ?
    `);
        activateStmt.run(new Date().toISOString(), id);
        return this.findById(id);
    },
    delete(id) {
        const stmt = database_1.default.prepare('DELETE FROM prompts WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
};
//# sourceMappingURL=prompt.js.map