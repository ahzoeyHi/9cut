@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   9Cut Docker 镜像打包脚本
echo ============================================
echo.

:: 配置变量
set IMAGE_NAME=crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com/ahzoey/ai-spoken
set VERSION=latest

:: 获取当前日期作为版本标签
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATE_TAG=%datetime:~0,8%

echo [1/4] 检查 Docker 是否运行...
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)
echo [√] Docker 已运行

echo.
echo [2/4] 构建 Docker 镜像...
echo 镜像名称: %IMAGE_NAME%
echo 版本标签: %VERSION%, %DATE_TAG%
echo.

docker build -t %IMAGE_NAME%:%VERSION% -t %IMAGE_NAME%:%DATE_TAG% .
if errorlevel 1 (
    echo [错误] 镜像构建失败
    pause
    exit /b 1
)
echo [√] 镜像构建成功

echo.
echo [3/4] 登录阿里云容器镜像服务...
echo 请输入阿里云容器镜像服务密码:
docker login crpi-umndlxo5qzmbd6ji.cn-beijing.personal.cr.aliyuncs.com
if errorlevel 1 (
    echo [错误] 登录失败
    pause
    exit /b 1
)
echo [√] 登录成功

echo.
echo [4/4] 推送镜像到阿里云...
docker push %IMAGE_NAME%:%VERSION%
if errorlevel 1 (
    echo [错误] 推送 latest 标签失败
    pause
    exit /b 1
)

docker push %IMAGE_NAME%:%DATE_TAG%
if errorlevel 1 (
    echo [错误] 推送日期标签失败
    pause
    exit /b 1
)

echo.
echo ============================================
echo   打包推送完成！
echo ============================================
echo.
echo 镜像地址:
echo   %IMAGE_NAME%:%VERSION%
echo   %IMAGE_NAME%:%DATE_TAG%
echo.
echo 拉取命令:
echo   docker pull %IMAGE_NAME%:%VERSION%
echo.

pause
