"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_1 = require("../models/config");
const prompt_1 = require("../models/prompt");
const models_1 = require("../services/ai/models");
const router = (0, express_1.Router)();
// ==================== AI服务配置 ====================
// 转换数据库字段为前端格式
function formatAIService(s) {
    return {
        id: s.id,
        serviceType: s.service_type,
        functionType: s.function_type,
        apiKey: '***', // 不返回实际密钥
        endpoint: s.endpoint,
        model: s.model,
        isEnabled: s.is_enabled === 1,
        extraConfig: s.extra_config ? JSON.parse(s.extra_config) : undefined,
        createdAt: s.created_at,
        updatedAt: s.updated_at
    };
}
// 获取AI服务配置列表
router.get('/ai-services', (_req, res) => {
    try {
        const services = config_1.aiServiceConfigModel.findAll();
        res.json({
            services: services.map(formatAIService)
        });
    }
    catch (error) {
        console.error('Error fetching AI services:', error);
        res.status(500).json({ message: '获取AI服务配置失败' });
    }
});
// 保存AI服务配置
router.post('/ai-services', (req, res) => {
    try {
        const { serviceType, functionType, apiKey, endpoint, model, isEnabled, extraConfig } = req.body;
        if (!serviceType || !functionType || !apiKey || !model) {
            return res.status(400).json({ message: '缺少必要参数' });
        }
        const service = config_1.aiServiceConfigModel.create({
            service_type: serviceType,
            function_type: functionType,
            api_key: apiKey,
            endpoint,
            model,
            is_enabled: isEnabled,
            extra_config: extraConfig
        });
        res.status(201).json({
            service: formatAIService(service)
        });
    }
    catch (error) {
        console.error('Error saving AI service:', error);
        res.status(500).json({ message: '保存AI服务配置失败' });
    }
});
// 测试AI服务连接
router.post('/ai-services/:id/test', async (req, res) => {
    try {
        const service = config_1.aiServiceConfigModel.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'AI服务配置不存在' });
        }
        // TODO: 实际测试连接逻辑
        // 这里暂时返回成功
        res.json({
            success: true,
            message: '连接测试成功'
        });
    }
    catch (error) {
        console.error('Error testing AI service:', error);
        res.status(500).json({
            success: false,
            message: '连接测试失败'
        });
    }
});
// 启用AI服务
router.post('/ai-services/:id/enable', (req, res) => {
    try {
        const service = config_1.aiServiceConfigModel.enable(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'AI服务配置不存在' });
        }
        res.json({
            service: formatAIService(service)
        });
    }
    catch (error) {
        console.error('Error enabling AI service:', error);
        res.status(500).json({ message: '启用AI服务失败' });
    }
});
// 获取可用模型列表
router.post('/ai-services/models', async (req, res) => {
    try {
        const { serviceType, functionType, apiKey, endpoint } = req.body;
        if (!serviceType || !functionType || !apiKey) {
            return res.status(400).json({ message: '缺少必要参数' });
        }
        const models = await (0, models_1.getAvailableModels)(serviceType, functionType, apiKey, endpoint);
        res.json({ models });
    }
    catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            message: '获取模型列表失败',
            error: error instanceof Error ? error.message : '未知错误'
        });
    }
});
// ==================== 提示词管理 ====================
// 转换数据库字段为前端格式
function formatPrompt(p) {
    return {
        id: p.id,
        name: p.name,
        content: p.content,
        functionType: p.function_type,
        isActive: p.is_active === 1,
        variables: p.variables ? JSON.parse(p.variables) : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
    };
}
// 获取提示词列表
router.get('/prompts', (req, res) => {
    try {
        const { functionType } = req.query;
        const prompts = prompt_1.promptModel.findAll(functionType);
        res.json({
            prompts: prompts.map(formatPrompt)
        });
    }
    catch (error) {
        console.error('Error fetching prompts:', error);
        res.status(500).json({ message: '获取提示词列表失败' });
    }
});
// 创建提示词
router.post('/prompts', (req, res) => {
    try {
        const { name, content, functionType } = req.body;
        if (!name || !content || !functionType) {
            return res.status(400).json({ message: '缺少必要参数' });
        }
        const prompt = prompt_1.promptModel.create({
            name,
            content,
            function_type: functionType
        });
        res.status(201).json({
            prompt: formatPrompt(prompt)
        });
    }
    catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({ message: '创建提示词失败' });
    }
});
// 更新提示词
router.put('/prompts/:id', (req, res) => {
    try {
        const { name, content } = req.body;
        const prompt = prompt_1.promptModel.update(req.params.id, { name, content });
        if (!prompt) {
            return res.status(404).json({ message: '提示词不存在' });
        }
        res.json({
            prompt: formatPrompt(prompt)
        });
    }
    catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({ message: '更新提示词失败' });
    }
});
// 激活提示词
router.post('/prompts/:id/activate', (req, res) => {
    try {
        const prompt = prompt_1.promptModel.activate(req.params.id);
        if (!prompt) {
            return res.status(404).json({ message: '提示词不存在' });
        }
        res.json({
            prompt: formatPrompt(prompt)
        });
    }
    catch (error) {
        console.error('Error activating prompt:', error);
        res.status(500).json({ message: '激活提示词失败' });
    }
});
// 删除提示词
router.delete('/prompts/:id', (req, res) => {
    try {
        const prompt = prompt_1.promptModel.findById(req.params.id);
        if (!prompt) {
            return res.status(404).json({ message: '提示词不存在' });
        }
        if (prompt.is_active === 1) {
            return res.status(400).json({ message: '不能删除当前生效的提示词' });
        }
        const success = prompt_1.promptModel.delete(req.params.id);
        res.json({ success });
    }
    catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({ message: '删除提示词失败' });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map