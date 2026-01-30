export declare function generateStoryboards(projectId: string, taskId: string): Promise<void>;
/**
 * 重新生成单个分镜
 */
export declare function regenerateSingleStoryboard(storyboardId: string, instruction: string): Promise<{
    success: boolean;
    storyboard?: any;
    error?: string;
}>;
//# sourceMappingURL=storyboard.d.ts.map