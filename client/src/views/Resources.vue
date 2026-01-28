<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { resourceApi } from '../api/resource';
import type { Resource, ResourceType } from '../types';

const resources = ref<Resource[]>([]);
const loading = ref(false);
const filterType = ref<ResourceType | 'all'>('all');

onMounted(async () => {
  await fetchResources();
});

const fetchResources = async () => {
  loading.value = true;
  try {
    const params = filterType.value !== 'all' ? { type: filterType.value } : {};
    const response = await resourceApi.getResources(params);
    resources.value = response.resources;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredResources = computed(() => {
  if (filterType.value === 'all') return resources.value;
  return resources.value.filter(r => r.type === filterType.value);
});

const downloadResource = async (resource: Resource) => {
  try {
    const blob = await resourceApi.downloadResource(resource.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resource.filePath.split('/').pop() || 'download';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
};

const deleteResource = async (id: string) => {
  if (!confirm('确定删除此资源吗？')) return;
  try {
    await resourceApi.deleteResource(id);
    resources.value = resources.value.filter(r => r.id !== id);
  } catch (e) {
    console.error(e);
  }
};

const getTypeIcon = (type: ResourceType) => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎬';
    case 'audio': return '🔊';
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">资源管理</h1>
        <nav class="flex items-center gap-4">
          <router-link to="/" class="text-gray-600 hover:text-gray-900">项目列表</router-link>
          <router-link to="/settings" class="text-gray-600 hover:text-gray-900">系统设置</router-link>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- 筛选栏 -->
      <div class="mb-6 flex items-center gap-4">
        <span class="text-gray-600">类型筛选:</span>
        <div class="flex gap-2">
          <button
            v-for="type in ['all', 'image', 'video', 'audio'] as const"
            :key="type"
            @click="filterType = type; fetchResources()"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              filterType === type ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            ]"
          >
            {{ type === 'all' ? '全部' : type === 'image' ? '图片' : type === 'video' ? '视频' : '音频' }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredResources.length === 0" class="text-center py-12">
        <p class="text-gray-500">暂无资源</p>
      </div>

      <!-- 资源列表 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <!-- 预览区 -->
          <div class="aspect-video bg-gray-100 flex items-center justify-center">
            <img
              v-if="resource.type === 'image'"
              :src="`/generated/${resource.filePath}`"
              class="w-full h-full object-cover"
            />
            <video
              v-else-if="resource.type === 'video'"
              :src="`/generated/${resource.filePath}`"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-4xl">{{ getTypeIcon(resource.type) }}</div>
          </div>

          <!-- 信息区 -->
          <div class="p-4">
            <div class="flex items-center gap-2 mb-2">
              <span>{{ getTypeIcon(resource.type) }}</span>
              <span class="text-sm font-medium text-gray-900 truncate">
                {{ resource.filePath.split('/').pop() }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mb-3">
              <div>大小: {{ formatFileSize(resource.fileSize) }}</div>
              <div>时间: {{ new Date(resource.createdAt).toLocaleString() }}</div>
            </div>
            <div class="flex gap-2">
              <button
                @click="downloadResource(resource)"
                class="flex-1 px-3 py-1.5 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded"
              >
                下载
              </button>
              <button
                @click="deleteResource(resource.id)"
                class="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
