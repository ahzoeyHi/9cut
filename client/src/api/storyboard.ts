import http from './http';
import type { Storyboard, StoryboardGroup } from '../types';

export interface GetStoryboardsResponse {
  storyboards: Storyboard[];
  groups: StoryboardGroup[];
}

export interface StoryboardResponse {
  storyboard: Storyboard;
}

export interface StoryboardsResponse {
  storyboards: Storyboard[];
}

export const storyboardApi = {
  getStoryboards(projectId: string): Promise<GetStoryboardsResponse> {
    return http.get(`/projects/${projectId}/storyboards`);
  },

  updateStoryboard(id: string, data: Partial<Storyboard>): Promise<StoryboardResponse> {
    return http.put(`/storyboards/${id}`, data);
  },

  reorderStoryboards(projectId: string, storyboardIds: string[]): Promise<StoryboardsResponse> {
    return http.post(`/projects/${projectId}/storyboards/reorder`, { storyboardIds });
  },

  generateStoryboards(projectId: string, regenerate = false): Promise<{ taskId: string }> {
    return http.post(`/projects/${projectId}/storyboards/generate`, { regenerate });
  }
};
