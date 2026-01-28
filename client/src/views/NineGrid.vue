<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStoryboardStore } from '../stores/storyboard';
import { generationApi } from '../api/generation';

const route = useRoute();
const router = useRouter();
const storyboardStore = useStoryboardStore();

const projectId = computed(() => route.params.id as string);

onMounted(async () => {
  await storyboardStore.fetchStoryboards(projectId.value);
});

const mergeGroupVideo = async (groupIndex: number) => {
  const group = storyboardStore.groupedStoryboards[groupIndex];
  if (!group) return;

  const storyboardIds = group.storyboards.map(s => s.id);
  try {
    await generationApi.mergeVideo(projectId.value, storyboardIds);
    alert('视频合并任务已提交');
  } catch (e) {
    console.error(e);
    alert('合并失败');
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'border-green-500';
    case 'processing': return 'border-yellow-500';
    case 'error': return 'border-red-500';
    default: return 'border-gray-300';
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
          <h1 class="text-xl font-bold text-gray-900">9宫格视图</h1>
        </div>
        <button
          @click="router.push(`/project/${projectId}/storyboard`)"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          分镜编辑
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="storyboardStore.loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="storyboardStore.groupedStoryboards.length === 0" class="text-center py-12">
        <p class="text-gray-500">暂无分镜分组</p>
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="(group, groupIndex) in storyboardStore.groupedStoryboards"
          :key="group.id"
          class="bg-white rounded-lg shadow-sm p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">
              第 {{ groupIndex + 1 }} 组
              <span class="text-sm font-normal text-gray-500">
                ({{ group.storyboards.length }} 个分镜)
              </span>
            </h2>
            <button
              @click="mergeGroupVideo(groupIndex)"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              合并视频
            </button>
          </div>

          <!-- 9宫格 -->
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="(storyboard, index) in group.storyboards"
              :key="storyboard.id"
              :class="['aspect-video bg-gray-100 rounded-lg overflow-hidden border-2', getStatusColor(storyboard.status)]"
            >
              <div v-if="storyboard.lastFrameUrl" class="relative h-full">
                <img :src="storyboard.lastFrameUrl" class="w-full h-full object-cover" />
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                  {{ groupIndex * 9 + index + 1 }}. {{ storyboard.sceneDescription || '分镜' }}
                </div>
              </div>
              <div v-else class="h-full flex flex-col items-center justify-center p-4">
                <span class="text-2xl font-bold text-gray-300">{{ groupIndex * 9 + index + 1 }}</span>
                <span class="text-xs text-gray-400 mt-2 text-center line-clamp-2">
                  {{ storyboard.sceneDescription || '待生成' }}
                </span>
              </div>
            </div>

            <!-- 填充空位 -->
            <div
              v-for="i in (9 - group.storyboards.length)"
              :key="`empty-${i}`"
              class="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center"
            >
              <span class="text-gray-300">空位</span>
            </div>
          </div>

          <!-- 合并视频预览 -->
          <div v-if="group.mergedVideoUrl" class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-medium text-gray-700 mb-2">合并视频</h3>
            <video :src="group.mergedVideoUrl" controls class="w-full max-w-md rounded"></video>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
