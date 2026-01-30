import type { Project, ProjectStatus } from '../types';
export interface CreateProjectData {
    name: string;
    description?: string;
    script?: string;
}
export interface UpdateProjectData {
    name?: string;
    description?: string;
    script?: string;
    status?: ProjectStatus;
}
export declare const projectModel: {
    findAll(): Project[];
    findById(id: string): Project | undefined;
    create(data: CreateProjectData): Project;
    update(id: string, data: UpdateProjectData): Project | undefined;
    delete(id: string): boolean;
    count(): number;
};
//# sourceMappingURL=project.d.ts.map