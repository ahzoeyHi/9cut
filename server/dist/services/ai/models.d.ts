import type { AIServiceType, FunctionType } from '../../types';
import { type ModelInfo } from './modelConfig';
export type { ModelInfo, ModelCapability } from './modelConfig';
/**
 * 获取指定服务的模型列表
 */
export declare function fetchModels(serviceType: AIServiceType, apiKey: string, endpoint?: string): Promise<ModelInfo[]>;
/**
 * 根据功能类型过滤模型列表
 */
export declare function filterModelsByFunction(models: ModelInfo[], functionType: FunctionType): ModelInfo[];
/**
 * 获取指定服务和功能类型的可用模型列表
 * 注意：现在返回所有模型，不再按功能类型过滤，让用户自己选择
 */
export declare function getAvailableModels(serviceType: AIServiceType, _functionType: FunctionType, apiKey: string, endpoint?: string): Promise<ModelInfo[]>;
/**
 * 获取配置的模型列表（不调用API，直接返回配置）
 */
export declare function getStaticModels(serviceType: AIServiceType): ModelInfo[];
//# sourceMappingURL=models.d.ts.map