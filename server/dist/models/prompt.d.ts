import type { Prompt, FunctionType } from '../types';
export interface CreatePromptData {
    name: string;
    content: string;
    function_type: FunctionType;
}
export interface UpdatePromptData {
    name?: string;
    content?: string;
}
export declare const promptModel: {
    findAll(functionType?: FunctionType): Prompt[];
    findById(id: string): Prompt | undefined;
    findActiveByFunction(functionType: FunctionType): Prompt | undefined;
    create(data: CreatePromptData): Prompt;
    update(id: string, data: UpdatePromptData): Prompt | undefined;
    activate(id: string): Prompt | undefined;
    delete(id: string): boolean;
};
//# sourceMappingURL=prompt.d.ts.map