<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStoryboardStore } from '../stores/storyboard';
import { generationApi } from '../api/generation';
import GenerationEditDialog from '../components/GenerationEditDialog.vue';
import type { Storyboard } from '../types';
import type { GenerationSessionType } from '../api/generationSession';

const route = useRoute();
const router = useRouter();
const storyboardStore = useStoryboardStore();

const projectId = computed(() => route.params.id as string);
const selectedStoryboard = ref<Storyboard | null>(null);
const editingId = ref<string | null>(null);
const editForm = ref({ sceneDescription: '', visualDescription: '', duration: 3000 });

// 多轮修改对话框状态
const showEditDialog = ref(false);
const editDialogType = ref<GenerationSessionType>('storyboard');
const editDialogStoryboardId = ref<string | undefined>(undefined);
const editDialogTitle = ref<string>('');

onMounted(async () => {
  await storyboardStore.fetchStoryboards(projectId.value);
});

const startEdit = (storyboard: Storyboard) => {
  editingId.value = storyboard.id;
  editForm.value = {
    sceneDescription: storyboard.sceneDescription || '',
    visualDescription: storyboard.visualDescription || '',
    duration: storyboard.duration
  };
};

const saveEdit = async () => {
  if (!editingId.value) return;
  await storyboardStore.updateStoryboard(editingId.value, editForm.value);
  editingId.value = null;
};

const cancelEdit = () => {
  editingId.value = null;
};

const generateImage = async (id: string) => {
  try {
    await generationApi.generateImage(id);
    storyboardStore.updateStoryboardLocally(id, { status: 'generating' });
  } catch (e) {
    console.error(e);
  }
};

const generateVideo = async (id: string) => {
  try {
    await generationApi.generateVideo(id);
    storyboardStore.updateStoryboardLocally(id, { status: 'generating' });
  } catch (e) {
    console.error(e);
  }
};

const generateSpeech = async (id: string) => {
  try {
    await generationApi.generateSpeech(id);
  } catch (e) {
    console.error(e);
  }
};

// 打开AI修改对话框
const openEditDialog = (type: GenerationSessionType, storyboard: Storyboard) => {
  editDialogType.value = type;
  editDialogStoryboardId.value = storyboard.id;
  editDialogTitle.value = `${storyboard.sceneDescription || '分镜'} - ${type === 'storyboard' ? '分镜' : type === 'image' ? '图片' : type === 'video' ? '视频' : '语音'}修改`;
  showEditDialog.value = true;
};

// 关闭对话框
const closeEditDialog = () => {
  showEditDialog.value = false;
};

// 修改应用后刷新
const handleEditApplied = async () => {
  showEditDialog.value = false;
  await storyboardStore.fetchStoryboards(projectId.value);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return { class: 'bg-green-100 text-green-800', text: '已完成' };
    case 'generating': return { class: 'bg-yellow-100 text-yellow-800', text: '生成中' };
    case 'error': return { class: 'bg-red-100 text-red-800', text: '失败' };
    default: return { class: 'bg-gray-100 text-gray-800', text: '待生成' };
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="router.push(`/project/${projectId}`)" class="text-gray-500 hover:text-gray-700">
            ← 返回项目
          </button>
          <h1 class="text-xl font-bold text-gray-900">分镜编辑</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            共 {{ storyboardStore.storyboardCount }} 个分镜，
            {{ storyboardStore.groupCount }} 个分组
          </span>
          <button
            @click="router.push(`/project/${projectId}/nine-grid`)"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            9宫格视图
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="storyboardStore.loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="storyboardStore.storyboards.length === 0" class="text-center py-12">
        <p class="text-gray-500">暂无分镜，请先在项目页面生成分镜</p>
        <button
          @click="router.push(`/project/${projectId}`)"
          class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          返回项目
        </button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(storyboard, index) in storyboardStore.storyboards"
          :key="storyboard.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- 序号 -->
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                {{ index + 1 }}
              </div>

              <!-- 内容区 -->
              <div class="flex-1 min-w-0">
                <div v-if="editingId === storyboard.id" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">场景描述</label>
                    <input
                      v-model="editForm.sceneDescription"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">画面说明</label>
                    <textarea
                      v-model="editForm.visualDescription"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    ></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">时长（毫秒）</label>
                    <input
                      v-model.number="editForm.duration"
                      type="number"
                      min="1000"
                      step="500"
                      class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div class="flex gap-2">
                    <button @click="saveEdit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                      保存
                    </button>
                    <button @click="cancelEdit" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      取消
                    </button>
                  </div>
                </div>

                <div v-else>
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-medium text-gray-900">{{ storyboard.sceneDescription || '未设置场景描述' }}</h3>
                    <span :class="['px-2 py-0.5 text-xs rounded-full', getStatusBadge(storyboard.status).class]">
                      {{ getStatusBadge(storyboard.status).text }}
                    </span>
                  </div>
                  <p class="text-gray-600 text-sm mb-3">{{ storyboard.visualDescription || '未设置画面说明' }}</p>
                  <div class="flex items-center gap-4 text-sm text-gray-500">
                    <span>时长: {{ (storyboard.duration / 1000).toFixed(1) }}s</span>
                    <span v-if="storyboard.narration" class="truncate max-w-xs">
                      口播: {{ storyboard.narration }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 资源预览 -->
              <div class="flex-shrink-0 flex gap-2">
                <div class="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                  <img v-if="storyboard.firstFrameUrl" :src="storyboard.firstFrameUrl" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">首帧</div>
                </div>
                <div class="w-24 h-16 bg-gray-100 rounded overflow-hidden">
                  <img v-if="storyboard.lastFrameUrl" :src="storyboard.lastFrameUrl" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">尾帧</div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex-shrink-0 flex flex-col gap-2">
                <button
                  v-if="editingId !== storyboard.id"
                  @click="startEdit(storyboard)"
                  class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  编辑
                </button>
                <button
                  @click="openEditDialog('storyboard', storyboard)"
                  class="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded"
                >
                  AI修改
                </button>
                <button
                  @click="generateImage(storyboard.id)"
                  class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded"
                >
                  生成图片
                </button>
                <button
                  @click="openEditDialog('image', storyboard)"
                  class="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded"
                >
                  修改图片
                </button>
                <button
                  @click="generateVideo(storyboard.id)"
                  class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded"
                >
                  生成视频
                </button>
                <button
                  @click="generateSpeech(storyboard.id)"
                  class="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded"
                >
                  生成语音
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- AI修改对话框 -->
    <GenerationEditDialog
      :visible="showEditDialog"
      :type="editDialogType"
      :project-id="projectId"
      :storyboard-id="editDialogStoryboardId"
      :title="editDialogTitle"
      @close="closeEditDialog"
      @applied="handleEditApplied"
    />
  </div>
</template>
