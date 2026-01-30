import type { Task, TaskType, TaskStatus } from '../types';
export interface CreateTaskData {
    type: TaskType;
    project_id?: string;
    storyboard_id?: string;
}
export interface UpdateTaskData {
    status?: TaskStatus;
    progress?: number;
    result?: Record<string, unknown>;
    error?: string;
}
export declare const taskModel: {
    findById(id: string): Task | undefined;
    findByProjectId(projectId: string): Task[];
    findPending(): Task[];
    findProcessing(): Task[];
    create(data: CreateTaskData): Task;
    update(id: string, data: UpdateTaskData): Task | undefined;
    delete(id: string): boolean;
};
//# sourceMappingURL=task.d.ts.map