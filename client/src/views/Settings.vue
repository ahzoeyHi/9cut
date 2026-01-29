<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useConfigStore } from '../stores/config';
import { configApi } from '../api/config';
import type { AIServiceType, FunctionType, AIServiceConfig, Prompt, ModelInfo } from '../types';

const configStore = useConfigStore();

const activeTab = ref<'ai-services' | 'prompts'>('ai-services');
const showServiceModal = ref(false);
const showPromptModal = ref(false);
const testingId = ref<string | null>(null);

// 模型相关状态
const availableModels = ref<ModelInfo[]>([]);
const loadingModels = ref(false);
const modelsError = ref<string | null>(null);
const useCustomModel = ref(false); // 是否使用自定义模型

const serviceForm = ref<Partial<AIServiceConfig>>({
  serviceType: 'openai',
  functionType: 'storyboard',
  apiKey: '',
  endpoint: '',
  model: '',
  isEnabled: false
});

const promptForm = ref<Partial<Prompt>>({
  name: '',
  content: '',
  functionType: 'storyboard'
});

const serviceTypes: { value: AIServiceType; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'volcengine', label: '火山引擎' },
  { value: 'qwen', label: '通义千问' }
];

const functionTypes: { value: FunctionType; label: string }[] = [
  { value: 'storyboard', label: '分镜生成' },
  { value: 'image', label: '图片生成' },
  { value: 'video', label: '视频生成' },
  { value: 'narration', label: '口播文案' },
  { value: 'speech', label: '语音合成' }
];

onMounted(async () => {
  await configStore.fetchAIServices();
  await configStore.fetchPrompts();
});

// 监听服务类型变化，清空模型列表（功能类型变化不影响模型列表）
watch(
  () => serviceForm.value.serviceType,
  () => {
    availableModels.value = [];
    serviceForm.value.model = '';
    modelsError.value = null;
  }
);

// 加载模型列表
const loadModels = async () => {
  const { serviceType, apiKey, endpoint } = serviceForm.value;

  if (!serviceType || !apiKey) {
    modelsError.value = '请先填写服务类型和API Key';
    return;
  }

  loadingModels.value = true;
  modelsError.value = null;

  try {
    const response = await configApi.getAvailableModels(
      serviceType as AIServiceType,
      serviceForm.value.functionType as FunctionType,
      apiKey,
      endpoint
    );
    availableModels.value = response.models;

    if (response.models.length === 0) {
      modelsError.value = '未获取到模型列表';
    }
  } catch (e) {
    console.error('Failed to load models:', e);
    modelsError.value = '加载模型列表失败，请检查API Key和端点地址';
  } finally {
    loadingModels.value = false;
  }
};

const saveService = async () => {
  await configStore.saveAIService(serviceForm.value);
  showServiceModal.value = false;
  resetServiceForm();
};

const testService = async (id: string) => {
  testingId.value = id;
  try {
    const result = await configStore.testAIService(id);
    alert(result.success ? '连接成功!' : `连接失败: ${result.message}`);
  } catch (e) {
    alert('测试失败');
  } finally {
    testingId.value = null;
  }
};

const enableService = async (id: string) => {
  await configStore.enableAIService(id);
};

const resetServiceForm = () => {
  serviceForm.value = {
    serviceType: 'openai',
    functionType: 'storyboard',
    apiKey: '',
    endpoint: '',
    model: '',
    isEnabled: false
  };
  availableModels.value = [];
  modelsError.value = null;
  useCustomModel.value = false;
};

// 切换自定义模型模式
const toggleCustomModel = () => {
  useCustomModel.value = !useCustomModel.value;
  if (useCustomModel.value) {
    availableModels.value = [];
  }
};

const savePrompt = async () => {
  if (promptForm.value.id) {
    await configStore.updatePrompt(promptForm.value.id, promptForm.value);
  } else {
    await configStore.createPrompt(promptForm.value as { name: string; content: string; functionType: FunctionType });
  }
  showPromptModal.value = false;
  resetPromptForm();
};

const editPrompt = (prompt: Prompt) => {
  promptForm.value = { ...prompt };
  showPromptModal.value = true;
};

const deletePrompt = async (id: string) => {
  if (!confirm('确定删除此提示词吗？')) return;
  await configStore.deletePrompt(id);
};

const activatePrompt = async (id: string) => {
  await configStore.activatePrompt(id);
};

const resetPromptForm = () => {
  promptForm.value = {
    name: '',
    content: '',
    functionType: 'storyboard'
  };
};

const getFunctionLabel = (type: FunctionType) => {
  return functionTypes.find(f => f.value === type)?.label || type;
};

const getServiceLabel = (type: AIServiceType) => {
  return serviceTypes.find(s => s.value === type)?.label || type;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">系统设置</h1>
        <nav class="flex items-center gap-4">
          <router-link to="/" class="text-gray-600 hover:text-gray-900">项目列表</router-link>
          <router-link to="/resources" class="text-gray-600 hover:text-gray-900">资源管理</router-link>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- 标签页 -->
      <div class="mb-6 border-b border-gray-200">
        <div class="flex gap-4">
          <button
            @click="activeTab = 'ai-services'"
            :class="[
              'px-4 py-2 font-medium border-b-2 transition-colors',
              activeTab === 'ai-services' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            AI服务配置
          </button>
          <button
            @click="activeTab = 'prompts'"
            :class="[
              'px-4 py-2 font-medium border-b-2 transition-colors',
              activeTab === 'prompts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            提示词管理
          </button>
        </div>
      </div>

      <!-- AI服务配置 -->
      <div v-if="activeTab === 'ai-services'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">AI服务配置</h2>
          <button
            @click="showServiceModal = true"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            添加配置
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">服务类型</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">功能</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="service in configStore.aiServices" :key="service.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ getServiceLabel(service.serviceType) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ getFunctionLabel(service.functionType) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ service.model }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    service.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]">
                    {{ service.isEnabled ? '已启用' : '未启用' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click="testService(service.id)"
                    :disabled="testingId === service.id"
                    class="text-primary-600 hover:text-primary-800 mr-3"
                  >
                    {{ testingId === service.id ? '测试中...' : '测试' }}
                  </button>
                  <button
                    v-if="!service.isEnabled"
                    @click="enableService(service.id)"
                    class="text-green-600 hover:text-green-800"
                  >
                    启用
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 提示词管理 -->
      <div v-if="activeTab === 'prompts'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900">提示词管理</h2>
          <button
            @click="showPromptModal = true"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            添加提示词
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="funcType in functionTypes" :key="funcType.value" class="bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-md font-semibold text-gray-900 mb-4">{{ funcType.label }}</h3>
            <div class="space-y-3">
              <div
                v-for="prompt in configStore.prompts.filter(p => p.functionType === funcType.value)"
                :key="prompt.id"
                :class="[
                  'p-4 rounded-lg border-2',
                  prompt.isActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                ]"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900">{{ prompt.name }}</span>
                  <div class="flex items-center gap-2">
                    <span v-if="prompt.isActive" class="text-xs text-primary-600 font-medium">当前生效</span>
                    <button
                      v-if="!prompt.isActive"
                      @click="activatePrompt(prompt.id)"
                      class="text-sm text-primary-600 hover:text-primary-800"
                    >
                      激活
                    </button>
                    <button @click="editPrompt(prompt)" class="text-sm text-gray-600 hover:text-gray-800">
                      编辑
                    </button>
                    <button @click="deletePrompt(prompt.id)" class="text-sm text-red-600 hover:text-red-800">
                      删除
                    </button>
                  </div>
                </div>
                <p class="text-sm text-gray-600 line-clamp-2">{{ prompt.content }}</p>
                <div v-if="prompt.variables && prompt.variables.length > 0" class="mt-2 flex gap-1 flex-wrap">
                  <span
                    v-for="variable in prompt.variables"
                    :key="variable"
                    class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {{ '{' + variable + '}' }}
                  </span>
                </div>
              </div>
              <div
                v-if="configStore.prompts.filter(p => p.functionType === funcType.value).length === 0"
                class="text-center py-4 text-gray-400"
              >
                暂无提示词
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 添加服务弹窗 -->
    <div v-if="showServiceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">添加AI服务配置</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">服务类型</label>
              <select v-model="serviceForm.serviceType" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option v-for="type in serviceTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">功能类型</label>
              <select v-model="serviceForm.functionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option v-for="type in functionTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input v-model="serviceForm.apiKey" type="password" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">端点地址（可选）</label>
              <input v-model="serviceForm.endpoint" type="text" placeholder="默认使用官方API地址" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700">模型选择</label>
                <button
                  @click="toggleCustomModel"
                  class="text-xs text-primary-600 hover:text-primary-800"
                >
                  {{ useCustomModel ? '从列表选择' : '手动输入模型' }}
                </button>
              </div>

              <!-- 自定义模型输入 -->
              <div v-if="useCustomModel">
                <input
                  v-model="serviceForm.model"
                  type="text"
                  placeholder="输入模型名称，如: gpt-4o, claude-3-opus-20240229"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p class="text-xs text-gray-500 mt-1">
                  适用于中转站或自定义API，直接输入模型名称即可
                </p>
              </div>

              <!-- 从列表选择模型 -->
              <div v-else>
                <div class="flex gap-2">
                  <select
                    v-if="availableModels.length > 0"
                    v-model="serviceForm.model"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">请选择模型</option>
                    <option v-for="model in availableModels" :key="model.id" :value="model.id">
                      {{ model.name }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="serviceForm.model"
                    type="text"
                    placeholder="点击右侧按钮加载模型列表"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    @click="loadModels"
                    :disabled="loadingModels || !serviceForm.apiKey"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {{ loadingModels ? '加载中...' : '加载模型' }}
                  </button>
                </div>
                <p v-if="modelsError" class="text-xs text-red-500 mt-1">{{ modelsError }}</p>
                <p v-else-if="availableModels.length > 0" class="text-xs text-green-600 mt-1">
                  已加载 {{ availableModels.length }} 个模型，请选择需要使用的模型
                </p>
                <p v-else class="text-xs text-gray-500 mt-1">
                  输入API Key后点击"加载模型"获取可用模型列表
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button @click="showServiceModal = false; resetServiceForm()" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
            取消
          </button>
          <button @click="saveService" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 添加提示词弹窗 -->
    <div v-if="showPromptModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div class="p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">{{ promptForm.id ? '编辑提示词' : '添加提示词' }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">提示词名称</label>
              <input v-model="promptForm.name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">功能类型</label>
              <select v-model="promptForm.functionType" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option v-for="type in functionTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">提示词内容</label>
              <textarea v-model="promptForm.content" rows="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
              <p class="text-xs text-gray-500 mt-1">支持变量: {文案}、{分镜描述}、{画面说明} 等</p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button @click="showPromptModal = false; resetPromptForm()" class="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
            取消
          </button>
          <button @click="savePrompt" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
