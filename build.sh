#!/bin/bash

echo "============================================"
echo "  9Cut Docker 镜像打包脚本 (本地版本)"
echo "============================================"
echo ""

# 配置变量
IMAGE_NAME="ai-spoken"
VERSION="latest"

# 获取当前日期作为版本标签
DATE_TAG=$(date +%Y%m%d)

echo "[1/2] 检查 Docker 是否运行..."
if ! docker info > /dev/null 2>&1; then
    echo "[错误] Docker 未运行，请先启动 Docker"
    exit 1
fi
echo "[√] Docker 已运行"

echo ""
echo "[2/2] 构建 Docker 镜像..."
echo "镜像名称: $IMAGE_NAME"
echo "版本标签: $VERSION, $DATE_TAG"
echo ""

if ! docker build -t "$IMAGE_NAME:$VERSION" -t "$IMAGE_NAME:$DATE_TAG" .; then
    echo "[错误] 镜像构建失败"
    exit 1
fi
echo "[√] 镜像构建成功"

echo ""
echo "============================================"
echo "  打包完成！"
echo "============================================"
echo ""
echo "本地镜像:"
echo "  $IMAGE_NAME:$VERSION"
echo "  $IMAGE_NAME:$DATE_TAG"
echo ""
