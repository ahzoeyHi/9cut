import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Project } from '../types';
import { projectApi } from '../api/project';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const currentProject = ref<Project | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const projectCount = computed(() => projects.value.length);

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const response = await projectApi.getProjects();
      projects.value = response.projects;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取项目列表失败';
    } finally {
      loading.value = false;
    }
  }

  async function fetchProject(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await projectApi.getProject(id);
      currentProject.value = response.project;
      return response;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取项目详情失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function createProject(data: { name: string; description?: string; script?: string }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await projectApi.createProject(data);
      projects.value.unshift(response.project);
      return response.project;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建项目失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateProject(id: string, data: Partial<Project>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await projectApi.updateProject(id, data);
      const index = projects.value.findIndex(p => p.id === id);
      if (index !== -1) {
        projects.value[index] = response.project;
      }
      if (currentProject.value?.id === id) {
        currentProject.value = response.project;
      }
      return response.project;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新项目失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProject(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await projectApi.deleteProject(id);
      projects.value = projects.value.filter(p => p.id !== id);
      if (currentProject.value?.id === id) {
        currentProject.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除项目失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function clearCurrentProject() {
    currentProject.value = null;
  }

  return {
    projects,
    currentProject,
    loading,
    error,
    projectCount,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearCurrentProject
  };
});
