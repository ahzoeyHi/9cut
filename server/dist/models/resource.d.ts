import type { Resource, ResourceType, ResourceSubtype } from '../types';
export interface CreateResourceData {
    type: ResourceType;
    subtype?: ResourceSubtype;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    storyboard_id?: string;
    project_id?: string;
    metadata?: Record<string, unknown>;
}
export declare const resourceModel: {
    findAll(filters?: {
        projectId?: string;
        storyboardId?: string;
        type?: ResourceType;
    }): Resource[];
    findById(id: string): Resource | undefined;
    create(data: CreateResourceData): Resource;
    delete(id: string): boolean;
    deleteByProjectId(projectId: string): number;
    linkToStoryboard(storyboardId: string, resourceId: string, role: "first_frame" | "last_frame" | "video" | "speech"): void;
    unlinkFromStoryboard(storyboardId: string, role: "first_frame" | "last_frame" | "video" | "speech"): void;
};
//# sourceMappingURL=resource.d.ts.map