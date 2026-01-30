import type { AIServiceConfig, AIServiceType, FunctionType } from '../types';
export interface CreateAIServiceConfigData {
    service_type: AIServiceType;
    function_type: FunctionType;
    api_key: string;
    endpoint?: string;
    model: string;
    is_enabled?: boolean;
    extra_config?: Record<string, unknown>;
}
export interface UpdateAIServiceConfigData {
    api_key?: string;
    endpoint?: string;
    model?: string;
    is_enabled?: boolean;
    extra_config?: Record<string, unknown>;
}
export declare const aiServiceConfigModel: {
    findAll(): AIServiceConfig[];
    findById(id: string): AIServiceConfig | undefined;
    findByFunction(functionType: FunctionType): AIServiceConfig[];
    findActiveByFunction(functionType: FunctionType): AIServiceConfig | undefined;
    create(data: CreateAIServiceConfigData): AIServiceConfig;
    update(id: string, data: UpdateAIServiceConfigData): AIServiceConfig | undefined;
    enable(id: string): AIServiceConfig | undefined;
    delete(id: string): boolean;
};
//# sourceMappingURL=config.d.ts.map