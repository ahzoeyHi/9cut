# 构建问题修复说明

## 问题描述

构建 Docker 镜像时出现 TypeScript 编译错误：

```
error TS6133: 'storyboardApi' is declared but its value is never read.
error TS6133: 'regeneratingId' is declared but its value is never read.
error TS6133: 'regenerateInstruction' is declared but its value is never read.
error TS6133: 'regenerateStatus' is declared but its value is never read.
error TS6133: 'regenerateMessage' is declared but its value is never read.
```

## 根本原因

`client/src/views/Storyboard.vue` 文件中存在以下问题：

1. 导入了 `storyboardApi` 但从未使用
2. 声明了 4 个重新生成相关的变量（`regeneratingId`, `regenerateInstruction`, `regenerateStatus`, `regenerateMessage`）但从未使用

这些是遗留代码，可能是之前的实现方案，后来改用了 `GenerationEditDialog` 组件实现多轮对话功能。

## 修复方案

### 已修复内容

1. **删除未使用的导入**
   ```typescript
   // 删除
   import { storyboardApi } from '../api/storyboard';
   ```

2. **删除未使用的变量声明**
   ```typescript
   // 删除以下变量
   const regeneratingId = ref<string | null>(null);
   const regenerateInstruction = ref('');
   const regenerateStatus = ref<'idle' | 'input' | 'generating' | 'success' | 'error'>('idle');
   const regenerateMessage = ref('');
   ```

### 验证结果

#### 本地构建测试

✅ **前端构建成功**
```bash
cd client && npm run build
# ✓ built in 5.44s
```

✅ **后端构建成功**
```bash
cd server && npm run build
# 编译成功，无错误
```

#### Docker 构建测试

现在可以成功构建 Docker 镜像：

```bash
# Windows
build.bat

# Linux/macOS
./build.sh

# 或直接使用 Docker
docker build -t 9cut:latest .
```

## 后续使用

### 源码构建

```bash
# 1. 克隆项目
git clone <repository-url>
cd 9cut

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 配置 AI 服务

# 3. 构建
# Windows
build.bat

# Linux/macOS
chmod +x build.sh
./build.sh
```

### Docker Compose 部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 配置 AI 服务和端口

# 2. 启动
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问
# http://localhost:${HTTP_PORT}
```

### 端口配置

在 `.env` 文件中配置：

```env
# 前端访问端口（默认 80）
HTTP_PORT=80

# 后端 API 端口（可选，默认不开放）
# BACKEND_PORT=3000
```

## 技术说明

### TypeScript 严格检查

项目使用了 TypeScript 严格模式，会检查：

- 未使用的变量（`noUnusedLocals`）
- 未使用的参数（`noUnusedParameters`）
- 类型安全检查

这有助于保持代码质量，避免遗留无用代码。

### 构建流程

#### 前端构建
1. TypeScript 类型检查：`vue-tsc -b`
2. Vite 打包：`vite build`
3. 输出到 `client/dist/`

#### 后端构建
1. TypeScript 编译：`tsc`
2. 输出到 `server/dist/`

#### Docker 多阶段构建
1. **Stage 1**: 前端构建（基于 node:20-alpine）
2. **Stage 2**: 后端构建（基于 node:20-alpine）
3. **Stage 3**: 生产镜像（安装 Nginx + 复制构建产物）

## 文件变更清单

### 修改的文件

1. `client/src/views/Storyboard.vue`
   - 删除未使用的 `storyboardApi` 导入
   - 删除未使用的重新生成状态变量

2. `docker-compose.yml`
   - 使用环境变量配置端口映射

3. `.env.example`
   - 添加 Docker 端口配置说明

4. `README.md`
   - 添加端口配置文档
   - 添加 TypeScript 编译错误故障排查

### 新增的文件

1. `.env.example.ports`
   - 端口配置快速参考文档
   - 包含 5 种常见部署场景

## 注意事项

1. **Node.js 版本要求**: >= 20.0.0
2. **Docker 版本要求**: >= 20.10
3. **磁盘空间**: 确保至少 2GB 可用空间用于构建
4. **网络连接**: 构建过程需要下载 npm 包，确保网络畅通

## 常见问题

### Q1: 构建时提示权限错误

**Linux/macOS**:
```bash
chmod +x build.sh
sudo chown -R $USER:$USER .
```

### Q2: npm install 失败

```bash
# 清除缓存
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### Q3: Docker 构建很慢

```bash
# 使用 Docker Compose 缓存
docker-compose build --no-cache  # 完全重建
docker-compose build             # 使用缓存

# 或使用国内镜像源
# 编辑 Dockerfile，在 FROM 后添加：
# RUN npm config set registry https://registry.npmmirror.com
```

---

**修复完成日期**: 2026-01-30
**测试状态**: ✅ 通过
**版本**: 1.0.0
