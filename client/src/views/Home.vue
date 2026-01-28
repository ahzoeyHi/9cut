<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';

const router = useRouter();
const projectStore = useProjectStore();

const showCreateModal = ref(false);
const newProject = ref({ name: '', description: '' });
const searchQuery = ref('');

onMounted(() => {
  projectStore.fetchProjects();
});

const filteredProjects = () => {
  if (!searchQuery.value) return projectStore.projects;
  const query = searchQuery.value.toLowerCase();
  return projectStore.projects.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query)
  );
};

const createProject = async () => {
  if (!newProject.value.name.trim()) return;
  try {
    const project = await projectStore.createProject(newProject.value);
    showCreateModal.value = false;
    newProject.value = { name: '', description: '' };
    router.push(`/project/${project.id}`);
  } catch (e) {
    console.error(e);
  }
};

const deleteProject = async (id: string) => {
  if (!confirm('确定要删除这个项目吗？所有关联的资源也会被删除。')) return;
  await projectStore.deleteProject(id);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'processing': return '处理中';
    default: return '草稿';
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">9Cut </h1>
        <nav class="flex items-center gap-4">
          <router-link to="/" class="text-gray-600 hover:text-gray-900">项目列表</router-link>
          <router-link to="/resources" class="text-gray-600 hover:text-gray-900">资源管理</router-link>
          <router-link to="/settings" class="text-gray-600 hover:text-gray-900">系统设置</router-link>
        </nav>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- 工具栏 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索项目..."
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 创建项目
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="projectStore.loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="projectStore.projects.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📹</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">还没有项目</h3>
        <p class="text-gray-500 mb-4">创建第一个项目开始生成口播视频</p>
        <button
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          创建项目
        </button>
      </div>

      <!-- 项目列表 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in filteredProjects()"
          :key="project.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          @click="router.push(`/project/${project.id}`)"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 truncate">{{ project.name }}</h3>
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusColor(project.status)]">
                {{ getStatusText(project.status) }}
              </span>
            </div>
            <p class="text-gray-500 text-sm mb-4 line-clamp-2">{{ project.description || '暂无描述' }}</p>
            <div class="flex items-center justify-between text-sm text-gray-400">
              <span>{{ new Date(project.updatedAt).toLocaleDateString() }}</span>
              <button
                @click.stop="deleteProject(project.id)"
                class="text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 创建项目弹窗 -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">创建新项目</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
              <input
                v-model="newProject.name"
                type="text"
                placeholder="请输入项目名称"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
              <textarea
                v-model="newProject.description"
                placeholder="请输入项目描述（可选）"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="createProject"
            :disabled="!newProject.name.trim()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
