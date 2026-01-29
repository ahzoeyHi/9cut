<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { scriptApi } from '../api/script';
import type { ScriptSession, ScriptSessionWithMessages, ScriptMessage } from '../api/script';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string);

// 会话列表
const sessions = ref<ScriptSession[]>([]);
const loadingSessions = ref(false);

// 当前会话
const currentSession = ref<ScriptSessionWithMessages | null>(null);
const loadingSession = ref(false);

// 消息输入
const messageInput = ref('');
const sending = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

// 新建会话
const showNewSessionModal = ref(false);
const newSessionTitle = ref('');

onMounted(async () => {
  await fetchSessions();
});

// 获取会话列表
async function fetchSessions() {
  loadingSessions.value = true;
  try {
    const res = await scriptApi.getSessions(projectId.value);
    sessions.value = res.sessions;
  } catch (e) {
    console.error('Failed to fetch sessions:', e);
  } finally {
    loadingSessions.value = false;
  }
}

// 创建新会话
async function createSession() {
  if (!newSessionTitle.value.trim()) {
    newSessionTitle.value = '新口播稿';
  }
  try {
    const res = await scriptApi.createSession(projectId.value, newSessionTitle.value);
    sessions.value.unshift(res.session as ScriptSession);
    showNewSessionModal.value = false;
    newSessionTitle.value = '';
    await selectSession(res.session.id);
  } catch (e) {
    console.error('Failed to create session:', e);
    alert('创建会话失败');
  }
}

// 选择会话
async function selectSession(sessionId: string) {
  loadingSession.value = true;
  try {
    const res = await scriptApi.getSession(sessionId);
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
  const tempUserMessage: ScriptMessage = {
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
    const res = await scriptApi.sendMessage(currentSession.value.id, content);
    // 更新用户消息ID（如果需要）
    // 添加AI回复
    currentSession.value.messages.push(res.message);
    if (res.script) {
      currentSession.value.currentScript = res.script;
    }
    await nextTick();
    scrollToBottom();
  } catch (e: any) {
    console.error('Failed to send message:', e);
    // 移除临时消息
    currentSession.value.messages = currentSession.value.messages.filter(
      m => m.id !== tempUserMessage.id
    );
    alert(e.response?.data?.message || '发送消息失败，请检查AI服务配置');
  } finally {
    sending.value = false;
  }
}

// 删除会话
async function deleteSession(sessionId: string) {
  if (!confirm('确定要删除这个会话吗？所有对话记录将被删除。')) return;
  try {
    await scriptApi.deleteSession(sessionId);
    sessions.value = sessions.value.filter(s => s.id !== sessionId);
    if (currentSession.value?.id === sessionId) {
      currentSession.value = null;
    }
  } catch (e) {
    console.error('Failed to delete session:', e);
    alert('删除会话失败');
  }
}

// 应用口播稿
async function applyScript() {
  if (!currentSession.value?.currentScript) {
    alert('当前没有可应用的口播稿');
    return;
  }
  try {
    await scriptApi.applyScript(currentSession.value.id);
    alert('口播稿已应用成功！');
  } catch (e) {
    console.error('Failed to apply script:', e);
    alert('应用口播稿失败');
  }
}

// 复制口播稿
function copyScript() {
  if (!currentSession.value?.currentScript) return;
  navigator.clipboard.writeText(currentSession.value.currentScript);
  alert('已复制到剪贴板');
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
    month: '2-digit',
    day: '2-digit',
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
          <h1 class="text-xl font-bold text-gray-900">口播稿生成</h1>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-6 h-[calc(100vh-180px)]">
        <!-- 左侧：会话列表 -->
        <div class="w-64 bg-white rounded-lg shadow-sm flex flex-col">
          <div class="p-4 border-b">
            <button
              @click="showNewSessionModal = true"
              class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + 新建对话
            </button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="loadingSessions" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>

            <div v-else-if="sessions.length === 0" class="text-center py-8 text-gray-400">
              <p>暂无会话</p>
              <p class="text-sm mt-1">点击上方按钮开始</p>
            </div>

            <div v-else class="divide-y">
              <div
                v-for="session in sessions"
                :key="session.id"
                @click="selectSession(session.id)"
                :class="[
                  'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                  currentSession?.id === session.id ? 'bg-primary-50' : ''
                ]"
              >
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-900 truncate">{{ session.title || '新口播稿' }}</span>
                  <button
                    @click.stop="deleteSession(session.id)"
                    class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ formatTime(session.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：对话区域 -->
        <div class="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
          <!-- 未选择会话 -->
          <div v-if="!currentSession" class="flex-1 flex items-center justify-center text-gray-400">
            <div class="text-center">
              <div class="text-5xl mb-4">💬</div>
              <p>选择一个会话或创建新会话</p>
              <p class="text-sm mt-1">开始生成口播稿</p>
            </div>
          </div>

          <!-- 加载中 -->
          <div v-else-if="loadingSession" class="flex-1 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>

          <!-- 对话内容 -->
          <template v-else>
            <!-- 标题栏 -->
            <div class="p-4 border-b flex items-center justify-between">
              <h2 class="font-semibold text-gray-900">{{ currentSession.title || '新口播稿' }}</h2>
              <div class="flex items-center gap-2">
                <button
                  v-if="currentSession.currentScript"
                  @click="copyScript"
                  class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  复制
                </button>
                <button
                  v-if="currentSession.currentScript"
                  @click="applyScript"
                  class="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  应用到项目
                </button>
              </div>
            </div>

            <!-- 消息列表 -->
            <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
              <!-- 欢迎消息 -->
              <div v-if="currentSession.messages.length === 0" class="text-center py-8 text-gray-400">
                <p class="mb-2">开始描述你想要的口播稿</p>
                <p class="text-sm">例如：帮我写一段关于健康饮食的口播稿，时长约1分钟</p>
              </div>

              <div
                v-for="message in currentSession.messages"
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
                  <div class="whitespace-pre-wrap break-words">{{ message.content }}</div>
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
                  <div class="flex items-center gap-2 text-gray-500">
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
                  placeholder="输入你的需求，按 Enter 发送，Shift+Enter 换行..."
                  rows="2"
                  :disabled="sending"
                  class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:opacity-50"
                ></textarea>
                <button
                  @click="sendMessage"
                  :disabled="!messageInput.trim() || sending"
                  class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                >
                  发送
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-2">
                提示：你可以要求修改语气、长度、风格等，AI会根据历史对话进行调整
              </p>
            </div>
          </template>
        </div>

        <!-- 口播稿预览（可选） -->
        <div v-if="currentSession?.currentScript" class="w-80 bg-white rounded-lg shadow-sm flex flex-col">
          <div class="p-4 border-b">
            <h3 class="font-semibold text-gray-900">当前口播稿</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {{ currentSession.currentScript }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 新建会话弹窗 -->
    <div v-if="showNewSessionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">新建口播稿会话</h2>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">会话标题</label>
            <input
              v-model="newSessionTitle"
              type="text"
              placeholder="例如：产品介绍口播稿"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              @keydown.enter="createSession"
            />
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            @click="showNewSessionModal = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="createSession"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
