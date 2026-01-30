import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Storyboard, StoryboardGroup } from '../types';
import { storyboardApi } from '../api/storyboard';

export const useStoryboardStore = defineStore('storyboard', () => {
  const storyboards = ref<Storyboard[]>([]);
  const groups = ref<StoryboardGroup[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const storyboardCount = computed(() => storyboards.value.length);
  const groupCount = computed(() => groups.value.length);

  // 按9个分组
  const groupedStoryboards = computed(() => {
    const result: StoryboardGroup[] = [];
    const sorted = [...storyboards.value].sort((a, b) => a.sequence - b.sequence);

    for (let i = 0; i < sorted.length; i += 9) {
      const groupStoryboards = sorted.slice(i, i + 9);
      const groupIndex = Math.floor(i / 9);
      result.push({
        id: `group-${groupIndex}`,
        index: groupIndex,
        storyboards: groupStoryboards,
        status: calculateGroupStatus(groupStoryboards)
      });
    }

    return result;
  });

  function calculateGroupStatus(items: Storyboard[]): StoryboardGroup['status'] {
    if (items.some(s => s.status === 'error')) return 'error';
    if (items.some(s => s.status === 'generating')) return 'processing';
    if (items.every(s => s.status === 'completed')) return 'completed';
    return 'pending';
  }

  async function fetchStoryboards(projectId: string) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyboardApi.getStoryboards(projectId);
      storyboards.value = response.storyboards;
      groups.value = response.groups || [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取分镜列表失败';
    } finally {
      loading.value = false;
    }
  }

  async function updateStoryboard(id: string, data: Partial<Storyboard>) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyboardApi.updateStoryboard(id, data);
      const index = storyboards.value.findIndex(s => s.id === id);
      if (index !== -1) {
        storyboards.value[index] = response.storyboard;
      }
      return response.storyboard;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '更新分镜失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function reorderStoryboards(projectId: string, storyboardIds: string[]) {
    loading.value = true;
    error.value = null;
    try {
      const response = await storyboardApi.reorderStoryboards(projectId, storyboardIds);
      storyboards.value = response.storyboards;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '调整顺序失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function updateStoryboardLocally(id: string, data: Partial<Storyboard>) {
    const index = storyboards.value.findIndex(s => s.id === id);
    if (index !== -1) {
      storyboards.value[index] = { ...storyboards.value[index], ...data } as Storyboard;
    }
  }

  function clearStoryboards() {
    storyboards.value = [];
    groups.value = [];
  }

  return {
    storyboards,
    groups,
    loading,
    error,
    storyboardCount,
    groupCount,
    groupedStoryboards,
    fetchStoryboards,
    updateStoryboard,
    reorderStoryboards,
    updateStoryboardLocally,
    clearStoryboards
  };
});
