/**
 * 生成口播文案
 */
export declare function generateNarration(projectId: string, taskId: string): Promise<void>;
/**
 * 拆分口播文案到分镜
 */
export declare function splitNarration(projectId: string, narration: string): Promise<{
    sequence: number;
    narration: string;
}[]>;
//# sourceMappingURL=narration.d.ts.map