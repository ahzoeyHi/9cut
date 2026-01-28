import http from './http';
import type { Project, Storyboard } from '../types';

export interface GetProjectsResponse {
  projects: Project[];
  total: number;
}

export interface GetProjectResponse {
  project: Project;
  storyboards: Storyboard[];
}

export interface ProjectResponse {
  project: Project;
}

export const projectApi = {
  getProjects(): Promise<GetProjectsResponse> {
    return http.get('/projects');
  },

  getProject(id: string): Promise<GetProjectResponse> {
    return http.get(`/projects/${id}`);
  },

  createProject(data: { name: string; description?: string; script?: string }): Promise<ProjectResponse> {
    return http.post('/projects', data);
  },

  updateProject(id: string, data: Partial<Project>): Promise<ProjectResponse> {
    return http.put(`/projects/${id}`, data);
  },

  deleteProject(id: string): Promise<{ success: boolean }> {
    return http.delete(`/projects/${id}`);
  }
};
