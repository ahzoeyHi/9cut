import type { AIServiceType } from '../../types';
export type ModelCapability = 'text' | 'image' | 'speech' | 'video' | 'embedding';
export interface ModelInfo {
    id: string;
    name: string;
    capabilities: ModelCapability[];
    description?: string;
}
/**
 * 获取指定服务的模型列表（优先从环境变量读取，否则使用默认值）
 */
export declare function getConfiguredModels(serviceType: AIServiceType): ModelInfo[];
/**
 * 获取所有服务的模型配置
 */
export declare function getAllConfiguredModels(): Record<AIServiceType, ModelInfo[]>;
/**
 * 生成模型配置字符串（用于导出配置）
 */
export declare function generateModelConfigString(models: ModelInfo[]): string;
/**
 * 获取默认模型列表（用于初始化或重置）
 */
export declare function getDefaultModels(serviceType: AIServiceType): ModelInfo[];
//# sourceMappingURL=modelConfig.d.ts.map