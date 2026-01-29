#!/bin/bash

echo "============================================"
echo "  9Cut Docker 镜像打包脚本"
echo "============================================"
echo ""

# 配置变量
IMAGE_NAME="crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com/ahzoey/ai-spoken"
VERSION="latest"

# 获取当前日期作为版本标签
DATE_TAG=$(date +%Y%m%d)

echo "[1/4] 检查 Docker 是否运行..."
if ! docker info > /dev/null 2>&1; then
    echo "[错误] Docker 未运行，请先启动 Docker"
    exit 1
fi
echo "[√] Docker 已运行"

echo ""
echo "[2/4] 构建 Docker 镜像..."
echo "镜像名称: $IMAGE_NAME"
echo "版本标签: $VERSION, $DATE_TAG"
echo ""

if ! docker build -t "$IMAGE_NAME:$VERSION" -t "$IMAGE_NAME:$DATE_TAG" .; then
    echo "[错误] 镜像构建失败"
    exit 1
fi
echo "[√] 镜像构建成功"

echo ""
echo "[3/4] 登录阿里云容器镜像服务..."
echo "请输入阿里云容器镜像服务密码:"
if ! docker login crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com; then
    echo "[错误] 登录失败"
    exit 1
fi
echo "[√] 登录成功"

echo ""
echo "[4/4] 推送镜像到阿里云..."
if ! docker push "$IMAGE_NAME:$VERSION"; then
    echo "[错误] 推送 latest 标签失败"
    exit 1
fi

if ! docker push "$IMAGE_NAME:$DATE_TAG"; then
    echo "[错误] 推送日期标签失败"
    exit 1
fi

echo ""
echo "============================================"
echo "  打包推送完成！"
echo "============================================"
echo ""
echo "镜像地址:"
echo "  $IMAGE_NAME:$VERSION"
echo "  $IMAGE_NAME:$DATE_TAG"
echo ""
echo "拉取命令:"
echo "  docker pull $IMAGE_NAME:$VERSION"
echo ""
