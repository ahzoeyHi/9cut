declare class TaskProcessor {
    private isRunning;
    private intervalId;
    start(): void;
    stop(): void;
    private processNextTask;
    private processTask;
}
export declare const taskProcessor: TaskProcessor;
export {};
//# sourceMappingURL=index.d.ts.map