<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { useStoryboardStore } from '../stores/storyboard';
import { storyboardApi } from '../api/storyboard';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const storyboardStore = useStoryboardStore();

const projectId = computed(() => route.params.id as string);
const isEditing = ref(false);
const editForm = ref({ name: '', description: '', script: '' });
const generating = ref(false);

onMounted(async () => {
  await projectStore.fetchProject(projectId.value);
  await storyboardStore.fetchStoryboards(projectId.value);
  if (projectStore.currentProject) {
    editForm.value = {
      name: projectStore.currentProject.name,
      description: projectStore.currentProject.description || '',
      script: projectStore.currentProject.script || ''
    };
  }
});

const saveProject = async () => {
  await projectStore.updateProject(projectId.value, editForm.value);
  isEditing.value = false;
};

const generateStoryboards = async () => {
  if (!editForm.value.script?.trim()) {
    alert('请先输入文案内容');
    return;
  }

  generating.value = true;
  try {
    // 先保存文案
    await projectStore.updateProject(projectId.value, { script: editForm.value.script });
    // 调用生成接口
    await storyboardApi.generateStoryboards(projectId.value);
    // 刷新分镜列表
    await storyboardStore.fetchStoryboards(projectId.value);
  } catch (e) {
    console.error(e);
    alert('生成失败，请重试');
  } finally {
    generating.value = false;
  }
};

const goToStoryboard = () => {
  router.push(`/project/${projectId.value}/storyboard`);
};

const goToNineGrid = () => {
  router.push(`/project/${projectId.value}/nine-grid`);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="router.push('/')" class="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </button>
          <h1 class="text-xl font-bold text-gray-900">
            {{ projectStore.currentProject?.name || '加载中...' }}
          </h1>
        </div>
        <nav class="flex items-center gap-4">
          <button @click="goToStoryboard" class="text-gray-600 hover:text-gray-900">分镜编辑</button>
          <button @click="goToNineGrid" class="text-gray-600 hover:text-gray-900">9宫格视图</button>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧：项目信息和文案输入 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 项目信息 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">项目信息</h2>
              <button
                v-if="!isEditing"
                @click="isEditing = true"
                class="text-primary-600 hover:text-primary-700"
              >
                编辑
              </button>
            </div>

            <div v-if="isEditing" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                <textarea
                  v-model="editForm.description"
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button @click="isEditing = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  取消
                </button>
                <button @click="saveProject" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  保存
                </button>
              </div>
            </div>

            <div v-else>
              <p class="text-gray-600">{{ projectStore.currentProject?.description || '暂无描述' }}</p>
            </div>
          </div>

          <!-- 文案输入 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">文案内容</h2>
              <button
                @click="generateStoryboards"
                :disabled="generating || !editForm.script?.trim()"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {{ generating ? '生成中...' : '生成分镜' }}
              </button>
            </div>
            <textarea
              v-model="editForm.script"
              placeholder="请输入口播文案内容，系统将自动生成分镜脚本..."
              rows="12"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
            ></textarea>
            <p class="text-sm text-gray-400 mt-2">
              提示：输入完整的口播文案后，点击"生成分镜"自动拆分为多个分镜场景
            </p>
          </div>
        </div>

        <!-- 右侧：分镜预览 -->
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">分镜预览</h2>
              <span class="text-sm text-gray-500">
                共 {{ storyboardStore.storyboardCount }} 个分镜
              </span>
            </div>

            <div v-if="storyboardStore.loading" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>

            <div v-else-if="storyboardStore.storyboards.length === 0" class="text-center py-8">
              <p class="text-gray-400">暂无分镜</p>
              <p class="text-sm text-gray-400 mt-1">输入文案后生成分镜</p>
            </div>

            <div v-else class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="(storyboard, index) in storyboardStore.storyboards.slice(0, 9)"
                :key="storyboard.id"
                class="p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                    {{ index + 1 }}
                  </span>
                  <span class="text-sm font-medium text-gray-700 truncate">
                    {{ storyboard.sceneDescription || '场景描述' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 line-clamp-2 ml-8">
                  {{ storyboard.visualDescription || '画面说明' }}
                </p>
              </div>

              <div v-if="storyboardStore.storyboards.length > 9" class="text-center pt-2">
                <button @click="goToStoryboard" class="text-primary-600 hover:text-primary-700 text-sm">
                  查看全部 {{ storyboardStore.storyboardCount }} 个分镜 →
                </button>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
            <div class="space-y-3">
              <button
                @click="goToStoryboard"
                class="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div class="font-medium text-gray-900">编辑分镜</div>
                <div class="text-sm text-gray-500">调整分镜内容和顺序</div>
              </button>
              <button
                @click="goToNineGrid"
                class="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div class="font-medium text-gray-900">9宫格视图</div>
                <div class="text-sm text-gray-500">查看分组和合并视频</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
