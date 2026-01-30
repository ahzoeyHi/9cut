# 9Cut - 口播视频自动生成系统

<div align="center">

一个基于 Vue 3 + Node.js + SQLite 的智能口播视频自动生成系统

支持从文案自动生成分镜脚本，自动生成图片、视频和语音，最终合成完整的口播视频

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/vue-3.5+-success.svg)](https://vuejs.org/)

</div>

---

## 📋 目录

- [项目简介](#-项目简介)
- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [系统架构](#-系统架构)
- [安装部署](#-安装部署)
  - [方式一：源码安装](#方式一源码安装)
  - [方式二：Docker Compose（推荐）](#方式二docker-compose推荐)
  - [方式三：Docker 镜像](#方式三docker-镜像)
- [配置说明](#-配置说明)
- [使用指南](#-使用指南)
- [开发指南](#-开发指南)
- [常见问题](#-常见问题)
- [许可证](#-许可证)

---

## 🎯 项目简介

**9Cut** 是一个强大的口播视频自动生成系统，通过 AI 技术自动化视频制作流程：

- 🤖 **AI 驱动**：集成多种 AI 服务（OpenAI、Claude、Gemini、通义千问、火山引擎）
- 📝 **智能分镜**：自动将文案转换为结构化的分镜脚本
- 🎬 **9宫格视频**：每9个分镜组成一组剧情连贯的视频内容
- 🖼️ **图片生成**：AI 自动生成分镜图片，首尾帧无缝衔接
- 🎥 **视频合成**：自动生成分镜视频并智能合并
- 🔊 **语音合成**：TTS 技术生成专业口播配音
- ⚙️ **灵活配置**：支持提示词模板管理和服务切换

---

## ✨ 核心功能

### 内容创作

- ✅ **项目管理**：创建、编辑、删除视频项目
- ✅ **文案输入**：支持多段落文本输入和文件导入
- ✅ **智能分镜**：AI 自动生成分镜脚本（场景描述、画面说明、时长）
- ✅ **9宫格分组**：自动按9个分镜一组进行管理

### AI 生成

- ✅ **图片生成**：为每个分镜生成首尾帧图片
- ✅ **视频生成**：基于首尾帧生成过渡视频（支持动效）
- ✅ **口播文案**：AI 生成适合朗读的口语化文案
- ✅ **语音合成**：多音色 TTS 语音生成
- ✅ **视频合并**：自动按序合并分镜视频

### 系统管理

- ✅ **AI 服务配置**：支持多种 AI 服务提供商
- ✅ **提示词管理**：为每个功能配置多个提示词模板
- ✅ **重新生成**：支持单个或批量重新生成内容
- ✅ **资源管理**：图片、视频、音频文件的统一管理

---

## 🛠️ 技术栈

### 前端

- **框架**: Vue 3.5+ (Composition API + `<script setup>`)
- **构建工具**: Vite 7.2+
- **类型检查**: TypeScript 5.9+
- **状态管理**: Pinia 3.0+
- **路由**: Vue Router 4.6+
- **UI 框架**: Tailwind CSS 3.4+
- **HTTP 客户端**: Axios 1.13+

### 后端

- **运行时**: Node.js 20+
- **框架**: Express 4.18+
- **数据库**: Better-SQLite3 9.4+
- **类型支持**: TypeScript 5.3+
- **文件上传**: Multer 1.4+
- **文件压缩**: Archiver 6.0+

### 部署

- **Web 服务器**: Nginx
- **容器化**: Docker + Docker Compose
- **进程管理**: PM2（可选）

---

## 🏗️ 系统架构

```
9cut/
├── client/                # 前端 Vue 应用
│   ├── src/
│   │   ├── components/    # Vue 组件
│   │   ├── views/         # 页面视图
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── router/        # 路由配置
│   │   └── utils/         # 工具函数
│   └── dist/              # 构建产物
│
├── server/                # 后端 Node.js 应用
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── database/      # 数据库模型
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── uploads/           # 上传文件目录
│   ├── generated/         # 生成资源目录
│   └── dist/              # 编译产物
│
├── nginx/                 # Nginx 配置
├── .env                   # 环境变量配置
├── docker-compose.yml     # Docker Compose 配置
└── Dockerfile             # Docker 镜像构建文件
```

---

## 🚀 安装部署

### 系统要求

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **操作系统**: Windows / macOS / Linux
- **浏览器**: Chrome / Firefox / Safari / Edge（最新版本）

---

### 方式一：源码安装

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/9cut.git
cd 9cut
```

#### 2. 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的参数（详见配置说明）
# 至少需要配置一个 AI 服务的 API Key
```

#### 4. 构建项目

**Windows 系统：**

```bash
# 在项目根目录执行
.\build.bat
```

**Linux / macOS 系统：**

```bash
# 在项目根目录执行
chmod +x build.sh
./build.sh
```

#### 5. 启动服务

```bash
# 启动后端服务
cd server
npm start

# 后端服务运行在 http://localhost:3000
```

#### 6. 配置 Nginx（可选）

如需使用 Nginx 作为前端服务器和反向代理：

```nginx
# 复制并修改 nginx 配置
cp nginx/9cut.conf /etc/nginx/sites-available/9cut.conf

# 修改配置中的路径为实际路径
# 创建软链接
ln -s /etc/nginx/sites-available/9cut.conf /etc/nginx/sites-enabled/

# 测试配置并重启 Nginx
nginx -t
systemctl restart nginx
```

访问 `http://localhost` 即可使用系统。

---

### 方式二：Docker Compose（推荐）

这是最简单的部署方式，适合快速体验和生产环境部署。

#### 1. 准备工作

```bash
# 克隆项目
git clone https://github.com/yourusername/9cut.git
cd 9cut

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 AI 服务 API Key
```

#### 2. 启动服务

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止服务并删除数据卷（慎用！）
docker-compose down -v
```

> 💡 **提示**：可以通过修改 `.env` 文件中的 `HTTP_PORT` 来自定义访问端口。例如设置 `HTTP_PORT=8080` 后，访问地址变为 `http://localhost:8080`

#### 3. 访问系统

访问地址取决于 `.env` 中的 `HTTP_PORT` 配置：

- **前端页面**: `http://localhost:${HTTP_PORT}` （默认 http://localhost）
- **后端 API**: `http://localhost:${HTTP_PORT}/api` （通过 Nginx 反向代理）

**不同端口配置的访问示例**：

| HTTP_PORT 配置 | 前端访问地址 | API 访问地址 |
|---------------|------------|-------------|
| 80 (默认) | http://localhost | http://localhost/api |
| 8080 | http://localhost:8080 | http://localhost:8080/api |
| 8000 | http://localhost:8000 | http://localhost:8000/api |

> 注意：为了安全，后端端口 3000 默认不对外开放，所有 API 请求通过 Nginx 反向代理到 `/api` 路径访问。

#### 4. 数据持久化

Docker Compose 会自动创建以下数据卷：

- `9cut-uploads`: 上传文件存储
- `9cut-generated`: 生成资源存储
- `9cut-database`: SQLite 数据库文件

数据会持久化保存，即使容器重启也不会丢失。

---

### 方式三：Docker 镜像

适合已有 Docker 环境的服务器部署。

#### 1. 拉取镜像

```bash
docker pull crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com/ahzoey/ai-spoken:latest
```

#### 2. 准备环境变量文件

```bash
# 创建 .env 文件
cat > .env << EOF
PORT=3000
NODE_ENV=production
DEFAULT_AI_SERVICE=openai
OPENAI_API_KEY=sk-your-api-key-here
API_KEY_ENCRYPTION_SECRET=your-secret-key-change-in-production
EOF
```

#### 3. 运行容器

```bash
docker run -d \
  --name 9cut-app \
  --restart unless-stopped \
  -p 80:80 \
  -v 9cut-uploads:/app/server/uploads \
  -v 9cut-generated:/app/server/generated \
  -v 9cut-database:/app/server \
  --env-file .env \
  crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com/ahzoey/ai-spoken:latest
```

> 注意：只开放 80 端口，后端 API 通过 Nginx 反向代理在 `/api` 路径访问，无需单独开放 3000 端口。

#### 4. 管理容器

```bash
# 查看日志
docker logs -f 9cut-app

# 停止容器
docker stop 9cut-app

# 启动容器
docker start 9cut-app

# 重启容器
docker restart 9cut-app

# 删除容器
docker rm -f 9cut-app
```

---

## ⚙️ 配置说明

### 环境变量配置（.env 文件）

#### Docker 端口映射配置

```env
# HTTP 端口映射（宿主机端口:容器端口 80）
# 默认: 80，可改为其他端口如 8080、8000 等
HTTP_PORT=80

# 后端 API 端口映射（可选）
# 默认不开放，所有 API 请求通过 Nginx 反向代理访问
# 如需直接访问后端 API，取消注释并设置端口
# BACKEND_PORT=3000
```

**端口配置说明**：

- `HTTP_PORT`：前端访问端口，默认 80
  - 如果 80 端口被占用，可改为 `8080`、`8000` 等
  - 修改后访问地址变为 `http://localhost:8080`

- `BACKEND_PORT`：后端 API 直接访问端口（可选）
  - 默认不开放，通过 Nginx 反向代理访问更安全
  - 如需调试或直接访问 API，取消注释此配置
  - 开放后可直接访问 `http://localhost:3000/api`

**常用端口配置示例**：

```env
# 示例 1: 默认配置（推荐）- 只开放 80 端口
HTTP_PORT=80
# BACKEND_PORT=3000

# 示例 2: 使用 8080 端口
HTTP_PORT=8080
# BACKEND_PORT=3000

# 示例 3: 开放后端调试端口
HTTP_PORT=80
BACKEND_PORT=3000

# 示例 4: 自定义两个端口
HTTP_PORT=8080
BACKEND_PORT=8001
```

#### 服务器配置

```env
# 服务器端口
PORT=3000

# 运行环境: development | production
NODE_ENV=production
```

#### 数据库配置

```env
# SQLite 数据库文件路径
DATABASE_PATH=./database.sqlite
```

#### 文件存储配置

```env
# 上传文件目录
UPLOAD_DIR=./uploads

# 生成资源目录
GENERATED_DIR=./generated

# 最大上传文件大小
MAX_FILE_SIZE=100MB
```

#### AI 服务配置

系统支持多种 AI 服务提供商，至少需要配置一个服务的 API Key。

##### 默认服务选择

```env
# 默认使用的 AI 服务: openai | claude | gemini | qwen | volcengine
DEFAULT_AI_SERVICE=openai
```

##### OpenAI 配置

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-api-key-here

# OpenAI API 端点（可选，默认为官方地址）
OPENAI_BASE_URL=https://api.openai.com/v1
```

##### Claude 配置

```env
# Claude API Key
CLAUDE_API_KEY=sk-ant-your-api-key-here

# Claude API 端点（可选）
CLAUDE_BASE_URL=https://api.anthropic.com
```

##### Gemini 配置

```env
# Google Gemini API Key
GEMINI_API_KEY=your-api-key-here
```

##### 通义千问配置

```env
# 阿里云通义千问 API Key
QWEN_API_KEY=your-api-key-here
```

##### 火山引擎配置

```env
# 字节跳动火山引擎 API Key
VOLCENGINE_API_KEY=your-api-key-here
```

#### 模型配置（高级）

如需自定义可用模型列表，可配置以下变量：

```env
# 格式: 模型ID:显示名称:能力1,能力2|模型ID:显示名称:能力1,能力2
# 能力类型: text, image, speech, video, embedding

# OpenAI 模型列表（可选，留空使用默认列表）
OPENAI_MODELS=gpt-4o:GPT-4o:text,image|gpt-4o-mini:GPT-4o Mini:text|dall-e-3:DALL-E 3:image|tts-1:TTS-1:speech

# Claude 模型列表（可选）
CLAUDE_MODELS=claude-sonnet-4-20250514:Claude Sonnet 4:text|claude-3-5-sonnet-20241022:Claude 3.5 Sonnet:text

# Gemini 模型列表（可选）
GEMINI_MODELS=gemini-2.5-pro-preview-05-06:Gemini 2.5 Pro:text,image|gemini-2.0-flash:Gemini 2.0 Flash:text,image

# 通义千问模型列表（可选）
QWEN_MODELS=qwen-max:通义千问-Max:text|wanx-v1:通义万相:image|cosyvoice-v1:CosyVoice:speech

# 火山引擎模型列表（可选）
VOLCENGINE_MODELS=doubao-pro-32k:豆包Pro 32K:text|doubao-vision-pro-32k:豆包Vision Pro 32K:text,image
```

#### 安全配置

```env
# API 密钥加密密钥 - 生产环境务必修改为随机字符串！
API_KEY_ENCRYPTION_SECRET=your-secret-key-change-in-production
```

#### 日志配置

```env
# 日志级别: debug | info | warn | error
LOG_LEVEL=info
```

#### FFmpeg 配置（视频处理）

```env
# FFmpeg 可执行文件路径（如已添加到 PATH 可留空）
FFMPEG_PATH=/usr/bin/ffmpeg
```

### 默认模型列表

如果不配置模型列表，系统将使用以下默认模型：

#### OpenAI 默认模型

- **文本**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4, gpt-3.5-turbo, o1, o1-mini, o1-preview, o3-mini
- **图片**: dall-e-3, dall-e-2
- **语音**: tts-1, tts-1-hd, whisper-1

#### Claude 默认模型

- claude-sonnet-4-20250514
- claude-3-5-sonnet-20241022
- claude-3-5-haiku-20241022
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

#### Gemini 默认模型

- gemini-2.5-pro-preview-05-06
- gemini-2.5-flash-preview-05-20
- gemini-2.0-flash, gemini-2.0-flash-lite
- gemini-1.5-pro, gemini-1.5-flash
- imagen-3.0-generate-002

#### 通义千问默认模型

- **文本**: qwen-max, qwen-max-latest, qwen-plus, qwen-plus-latest, qwen-turbo, qwen-turbo-latest
- **视觉**: qwen-vl-max, qwen-vl-plus
- **图片**: wanx-v1, wanx2.1-t2i-turbo, wanx2.1-t2i-plus
- **语音**: cosyvoice-v1, sambert-zhichu-v1

#### 火山引擎默认模型

- doubao-pro-32k, doubao-pro-128k, doubao-pro-256k
- doubao-lite-32k, doubao-lite-128k
- doubao-vision-pro-32k, doubao-vision-lite-32k

---

## 📖 使用指南

### 快速开始

1. **创建项目**
   - 点击"新建项目"按钮
   - 输入项目名称和描述
   - 点击"创建"

2. **输入文案**
   - 在文案编辑器中输入或粘贴口播文案
   - 支持从 txt/docx 文件导入
   - 点击"保存文案"

3. **生成分镜**
   - 点击"生成分镜"按钮
   - 系统将调用 AI 自动生成分镜脚本
   - 查看并编辑生成的分镜内容

4. **生成资源**
   - 点击"生成图片"，为每个分镜生成首尾帧
   - 点击"生成视频"，基于图片生成分镜视频
   - 点击"生成口播"，生成口播文案和语音

5. **合并视频**
   - 所有分镜视频生成完成后
   - 点击"合并视频"按钮
   - 下载最终生成的完整视频

### AI 服务配置

1. **添加 API Key**
   - 进入"设置" > "AI 服务配置"
   - 选择服务提供商
   - 输入 API Key 和其他配置
   - 点击"测试连接"验证配置
   - 保存配置

2. **切换服务**
   - 在配置页面选择要使用的服务
   - 为不同功能（文本生成、图片生成、语音合成）选择不同服务
   - 配置立即生效

### 提示词管理

1. **创建提示词模板**
   - 进入"设置" > "提示词管理"
   - 选择功能类型（分镜生成/口播文案生成等）
   - 创建新的提示词模板
   - 使用变量占位符（如 `{文案}`、`{分镜描述}`）

2. **切换生效模板**
   - 在提示词列表中选择要使用的模板
   - 点击"设为生效"
   - 后续生成将使用新的提示词

---

## 🔧 开发指南

### 本地开发

#### 前端开发

```bash
cd client

# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run dev

# 访问 http://localhost:5173
```

#### 后端开发

```bash
cd server

# 安装依赖
npm install

# 启动开发服务器（支持热更新）
npm run dev

# 后端运行在 http://localhost:3000
```

### 构建生产版本

```bash
# 前端构建
cd client
npm run build

# 后端构建
cd server
npm run build
```

### Docker 镜像构建

```bash
# 构建镜像
docker build -t 9cut:latest .

# 运行镜像
docker run -d -p 80:80 -p 3000:3000 --env-file .env 9cut:latest
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 ESLint 进行代码质量检查
- 使用 Prettier 进行代码格式化

---

## ❓ 常见问题

### 1. AI 服务调用失败

**问题**: 提示"AI 服务调用失败"或"API Key 无效"

**解决方案**:
- 检查 `.env` 文件中的 API Key 是否正确
- 确认 API Key 有足够的额度和权限
- 检查网络连接，确保可以访问 AI 服务 API
- 查看后端日志获取详细错误信息

### 2. Docker 容器无法启动

**问题**: `docker-compose up` 失败

**解决方案**:
- 确保 `.env` 文件存在且配置正确
- 检查端口 80 和 3000 是否被占用
- 查看容器日志: `docker-compose logs`
- 确保 Docker 版本 >= 20.10

### 3. 视频生成失败

**问题**: 分镜视频生成失败

**解决方案**:
- 确保系统已安装 FFmpeg
- 检查 FFmpeg 是否在系统 PATH 中
- 如使用 Docker，确保镜像包含 FFmpeg
- 查看后端日志获取 FFmpeg 错误信息

### 4. 文件上传失败

**问题**: 上传文件时报错

**解决方案**:
- 检查 `MAX_FILE_SIZE` 配置
- 确保上传目录有写入权限
- 检查磁盘空间是否充足

### 5. 数据库错误

**问题**: SQLite 数据库相关错误

**解决方案**:
- 确保 `DATABASE_PATH` 目录有写入权限
- 删除 `database.sqlite` 重新初始化（注意备份数据）
- 运行数据库迁移: `npm run db:migrate`

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -am 'Add some feature'`
4. 推送到分支: `git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📧 联系方式

- **项目主页**: https://github.com/yourusername/9cut
- **问题反馈**: https://github.com/yourusername/9cut/issues

---

<div align="center">

**9Cut** - 让视频创作更简单 🎬

Made with ❤️ by 9Cut Team

</div>
