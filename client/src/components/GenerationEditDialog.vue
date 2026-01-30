<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { generationSessionApi } from '../api/generationSession';
import type {
  GenerationSessionType,
  GenerationSession,
  GenerationSessionWithMessages,
  GenerationMessage
} from '../api/generationSession';

const props = defineProps<{
  visible: boolean;
  type: GenerationSessionType;
  projectId: string;
  storyboardId?: string;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'applied', result: string): void;
}>();

// 会话列表
const sessions = ref<GenerationSession[]>([]);
const loadingSessions = ref(false);

// 当前会话
const currentSession = ref<GenerationSessionWithMessages | null>(null);
const loadingSession = ref(false);

// 消息输入
const messageInput = ref('');
const sending = ref(false);
const saving = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// 类型标签
const typeLabels: Record<GenerationSessionType, string> = {
  storyboard: '分镜',
  image: '图片',
  video: '视频',
  speech: '语音'
};

const dialogTitle = computed(() => {
  return `${typeLabels[props.type]}修改 - AI辅助`;
});

// 保存按钮文本
const saveButtonText = computed(() => {
  const labels: Record<GenerationSessionType, string> = {
    storyboard: '保存到分镜',
    image: '保存提示词',
    video: '保存视频参数',
    speech: '保存语音参数'
  };
  return labels[props.type];
});

// 监听visible变化
watch(() => props.visible, async (visible) => {
  if (visible) {
    await fetchSessions();
    // 如果没有会话，自动创建一个
    if (sessions.value.length === 0) {
      await createSession();
    } else if (sessions.value[0]) {
      // 选择最新的会话
      await selectSession(sessions.value[0].id);
    }
  }
});

// 获取会话列表
async function fetchSessions() {
  loadingSessions.value = true;
  try {
    const res = props.storyboardId
      ? await generationSessionApi.getStoryboardSessions(props.storyboardId, props.type)
      : await generationSessionApi.getProjectSessions(props.projectId, props.type);
    sessions.value = res.sessions;
  } catch (e) {
    console.error('Failed to fetch sessions:', e);
  } finally {
    loadingSessions.value = false;
  }
}

// 创建新会话
async function createSession() {
  try {
    const res = await generationSessionApi.createSession({
      type: props.type,
      projectId: props.projectId,
      storyboardId: props.storyboardId,
      title: props.title
    });
    sessions.value.unshift(res.session as GenerationSession);
    await selectSession(res.session.id);
  } catch (e) {
    console.error('Failed to create session:', e);
  }
}

// 选择会话
async function selectSession(sessionId: string) {
  loadingSession.value = true;
  try {
    const res = await generationSessionApi.getSession(sessionId);
    currentSession.value = res.session;
    await nextTick();
    scrollToBottom();
  } catch (e) {
    console.error('Failed to fetch session:', e);
  } finally {
    loadingSession.value = false;
  }
}

// 发送消息
async function sendMessage() {
  if (!messageInput.value.trim() || !currentSession.value || sending.value) return;

  const content = messageInput.value.trim();
  messageInput.value = '';
  sending.value = true;

  // 先添加用户消息到界面
  const tempUserMessage: GenerationMessage = {
    id: 'temp-' + Date.now(),
    sessionId: currentSession.value.id,
    role: 'user',
    content,
    createdAt: new Date().toISOString()
  };
  currentSession.value.messages.push(tempUserMessage);
  await nextTick();
  scrollToBottom();

  try {
    const res = await generationSessionApi.sendMessage(currentSession.value.id, content);
    currentSession.value.messages.push(res.message);
    if (res.result) {
      currentSession.value.currentResult = res.result;
    }
    await nextTick();
    scrollToBottom();
  } catch (e: any) {
    console.error('Failed to send message:', e);
    currentSession.value.messages = currentSession.value.messages.filter(
      m => m.id !== tempUserMessage.id
    );
    alert(e.response?.data?.message || '发送消息失败，请检查AI服务配置');
  } finally {
    sending.value = false;
  }
}

// 应用修改（保存到对应位置）
async function applyChanges() {
  if (!currentSession.value?.currentResult) {
    alert('当前没有可应用的修改');
    return;
  }

  saving.value = true;
  try {
    let success = false;
    let message = '';

    switch (props.type) {
      case 'storyboard':
        await generationSessionApi.applyStoryboardChanges(currentSession.value.id);
        message = '分镜修改已保存！';
        success = true;
        break;
      case 'image':
        await generationSessionApi.applyImageChanges(currentSession.value.id);
        message = '图片提示词已保存到画面说明！';
        success = true;
        break;
      case 'video':
        await generationSessionApi.applyVideoChanges(currentSession.value.id);
        message = '视频参数已保存！';
        success = true;
        break;
      case 'speech':
        await generationSessionApi.applySpeechChanges(currentSession.value.id);
        message = '语音参数已保存！';
        success = true;
        break;
    }

    if (success) {
      alert(message);
      emit('applied', currentSession.value.currentResult);
    }
  } catch (e: any) {
    console.error('Failed to apply changes:', e);
    alert(e.response?.data?.message || '保存修改失败');
  } finally {
    saving.value = false;
  }
}

// 重新生成图片
async function regenerateImageHandler() {
  if (!currentSession.value || !props.storyboardId) return;

  try {
    const res = await generationSessionApi.regenerateImage(
      currentSession.value.id,
      props.storyboardId
    );
    alert('图片已重新生成！');
    emit('applied', res.imagePath);
  } catch (e: any) {
    console.error('Failed to regenerate image:', e);
    alert(e.response?.data?.message || '重新生成图片失败');
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 格式化时间
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 处理按键
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 关闭弹窗
function handleClose() {
  emit('close');
}

// 提示词示例
const promptExamples: Record<GenerationSessionType, string[]> = {
  storyboard: [
    '让场景描述更加生动具体',
    '将时长调整为5秒',
    '优化画面说明，突出产品特点',
    '口播文案改成更口语化的表达'
  ],
  image: [
    '让画面更加明亮',
    '添加一些科技感元素',
    '换成暖色调',
    '去掉背景中的人物'
  ],
  video: [
    '使用淡入淡出效果',
    '增加缩放动画',
    '让过渡更加平滑',
    '调整为3秒时长'
  ],
  speech: [
    '语速稍微放慢一点',
    '让语气更加热情',
    '文案改成更正式的表达',
    '添加一些停顿'
  ]
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
      <!-- 标题栏 -->
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">{{ dialogTitle }}</h2>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </div>

      <!-- 主内容区 -->
      <div class="flex-1 flex overflow-hidden">
        <!-- 对话区域 -->
        <div class="flex-1 flex flex-col">
          <!-- 消息列表 -->
          <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- 欢迎消息 -->
            <div v-if="!currentSession?.messages?.length" class="text-center py-8">
              <p class="text-gray-500 mb-4">描述你想要的修改，AI将帮你优化</p>
              <div class="flex flex-wrap justify-center gap-2">
                <button
                  v-for="example in promptExamples[type]"
                  :key="example"
                  @click="messageInput = example"
                  class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600"
                >
                  {{ example }}
                </button>
              </div>
            </div>

            <div
              v-for="message in currentSession?.messages || []"
              :key="message.id"
              :class="[
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'max-w-[80%] rounded-lg px-4 py-3',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                ]"
              >
                <div class="whitespace-pre-wrap break-words text-sm">{{ message.content }}</div>
                <div
                  :class="[
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                  ]"
                >
                  {{ formatTime(message.createdAt) }}
                </div>
              </div>
            </div>

            <!-- 发送中指示器 -->
            <div v-if="sending" class="flex justify-start">
              <div class="bg-gray-100 rounded-lg px-4 py-3">
                <div class="flex items-center gap-2 text-gray-500 text-sm">
                  <div class="animate-pulse">正在思考...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="p-4 border-t">
            <div class="flex gap-3">
              <textarea
                v-model="messageInput"
                @keydown="handleKeydown"
                placeholder="描述你想要的修改..."
                rows="2"
                :disabled="sending"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm disabled:opacity-50"
              ></textarea>
              <button
                @click="sendMessage"
                :disabled="!messageInput.trim() || sending"
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        <!-- 结果预览 -->
        <div v-if="currentSession?.currentResult" class="w-64 border-l flex flex-col">
          <div class="p-4 border-b">
            <h3 class="font-semibold text-gray-900 text-sm">修改结果</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <pre class="whitespace-pre-wrap text-xs text-gray-700 font-mono">{{ currentSession.currentResult }}</pre>
          </div>
          <div class="p-4 border-t space-y-2">
            <!-- 统一的保存按钮 -->
            <button
              @click="applyChanges"
              :disabled="saving"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm"
            >
              {{ saving ? '保存中...' : saveButtonText }}
            </button>
            <!-- 图片类型额外的重新生成按钮 -->
            <button
              v-if="type === 'image' && storyboardId"
              @click="regenerateImageHandler"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              重新生成图片
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
