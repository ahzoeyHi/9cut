import http from './http';
import type { Resource, ResourceType } from '../types';

export interface ResourcesResponse {
  resources: Resource[];
}

export interface ResourceResponse {
  resource: Resource;
}

export const resourceApi = {
  getResources(params?: { projectId?: string; type?: ResourceType; storyboardId?: string }): Promise<ResourcesResponse> {
    return http.get('/resources', { params });
  },

  uploadResource(file: File, type: ResourceType, storyboardId?: string): Promise<ResourceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (storyboardId) {
      formData.append('storyboardId', storyboardId);
    }
    return http.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  downloadResource(id: string): Promise<Blob> {
    return http.get(`/resources/${id}/download`, { responseType: 'blob' });
  },

  deleteResource(id: string): Promise<{ success: boolean }> {
    return http.delete(`/resources/${id}`);
  },

  batchDownload(resourceIds: string[]): Promise<Blob> {
    return http.post('/resources/batch-download', { resourceIds }, { responseType: 'blob' });
  }
};
