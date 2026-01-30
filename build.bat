@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   9Cut Docker 镜像打包脚本 (本地版本)
echo ============================================
echo.

:: 配置变量
set IMAGE_NAME=ai-spoken
set VERSION=latest

:: 获取当前日期作为版本标签
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set DATE_TAG=%datetime:~0,8%

echo [1/2] 检查 Docker 是否运行...
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)
echo [√] Docker 已运行

echo.
echo [2/2] 构建 Docker 镜像...
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
echo ============================================
echo   打包完成！
echo ============================================
echo.
echo 本地镜像:
echo   %IMAGE_NAME%:%VERSION%
echo   %IMAGE_NAME%:%DATE_TAG%
echo.

pause