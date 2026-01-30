import type { Storyboard, StoryboardWithResources, StoryboardStatus, StoryboardGroup } from '../types';
export interface CreateStoryboardData {
    project_id: string;
    sequence: number;
    scene_description?: string;
    visual_description?: string;
    duration?: number;
    narration?: string;
}
export interface UpdateStoryboardData {
    scene_description?: string;
    visual_description?: string;
    duration?: number;
    narration?: string;
    status?: StoryboardStatus;
    group_index?: number;
}
export declare const storyboardModel: {
    findByProjectId(projectId: string): StoryboardWithResources[];
    findById(id: string): StoryboardWithResources | undefined;
    create(data: CreateStoryboardData): Storyboard;
    createBatch(storyboards: CreateStoryboardData[]): Storyboard[];
    update(id: string, data: UpdateStoryboardData): Storyboard | undefined;
    updateSequences(projectId: string, storyboardIds: string[]): Storyboard[];
    deleteByProjectId(projectId: string): number;
    delete(id: string): boolean;
    getGroups(projectId: string): StoryboardGroup[];
};
//# sourceMappingURL=storyboard.d.ts.map