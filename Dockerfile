# 9Cut - 多阶段构建 Dockerfile

# ==================== 阶段1: 前端构建 ====================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# 复制前端依赖文件
COPY client/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源代码
COPY client/ ./

# 构建前端
RUN npm run build

# ==================== 阶段2: 后端构建 ====================
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# 复制后端依赖文件
COPY server/package*.json ./

# 安装后端依赖（包括开发依赖用于编译）
RUN npm install

# 复制后端源代码
COPY server/ ./

# 构建后端
RUN npm run build

# ==================== 阶段3: 生产镜像 ====================
FROM node:20-alpine AS production

# 安装 nginx 和必要工具
RUN apk add --no-cache nginx python3 make g++

WORKDIR /app

# 复制后端编译产物和依赖
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package*.json ./server/

# 安装后端生产依赖（需要重新编译 better-sqlite3）
WORKDIR /app/server
RUN npm install --production

# 复制前端构建产物
WORKDIR /app
COPY --from=client-builder /app/client/dist ./client/dist

# 复制 nginx 配置
COPY nginx/9cut.conf /etc/nginx/http.d/default.conf

# 创建必要目录
RUN mkdir -p /app/server/uploads /app/server/generated /var/log/nginx

# 更新 nginx 配置中的路径
RUN sed -i 's|/var/www/9cut/dist|/app/client/dist|g' /etc/nginx/http.d/default.conf && \
    sed -i 's|/var/www/9cut/server/generated|/app/server/generated|g' /etc/nginx/http.d/default.conf && \
    sed -i 's|/var/www/9cut/server/uploads|/app/server/uploads|g' /etc/nginx/http.d/default.conf && \
    sed -i 's|127.0.0.1:3000|localhost:3000|g' /etc/nginx/http.d/default.conf

# 创建启动脚本
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx' >> /app/start.sh && \
    echo 'cd /app/server && node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# 设置工作目录
WORKDIR /app/server

# 暴露端口
EXPOSE 80 3000

# 数据卷
VOLUME ["/app/server/uploads", "/app/server/generated", "/app/server/data"]

# 启动命令
CMD ["/app/start.sh"]
