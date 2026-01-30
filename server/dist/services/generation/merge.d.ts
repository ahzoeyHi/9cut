/**
 * 合并多个分镜视频
 */
export declare function mergeVideos(projectId: string, taskId: string, storyboardIds?: string[]): Promise<void>;
/**
 * 合并视频并添加音频轨道
 */
export declare function mergeVideoWithAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void>;
//# sourceMappingURL=merge.d.ts.map