/**
 * 使用FFmpeg生成从首帧到尾帧的过渡视频
 * 支持：淡入淡出、缩放、平移等效果
 */
export declare function generateVideo(storyboardId: string, taskId: string): Promise<void>;
/**
 * 生成简单的单图视频（用于首帧和尾帧相同的情况）
 */
export declare function generateSimpleVideo(imagePath: string, outputPath: string, duration: number): Promise<void>;
//# sourceMappingURL=video.d.ts.map