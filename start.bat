@echo off
chcp 65001 >nul

echo 🚀 启动个人博客系统...

REM 检查Node.js环境
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version
echo ✅ npm 版本:
npm --version

REM 创建必要的目录
if not exist "backend\uploads" mkdir backend\uploads

echo 📦 安装前端依赖...
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

echo 📦 安装后端依赖...
cd ..\backend
call npm install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

cd ..

echo 🔧 检查环境配置...

REM 检查环境变量文件
if not exist ".env" (
    echo ⚠️  未找到 .env 文件，使用默认配置
    copy .env.example .env >nul
)

if not exist "backend\.env" (
    echo ⚠️  未找到后端 .env 文件，使用默认配置
    copy backend\.env.example backend\.env >nul
)

echo ✅ 环境配置检查完成

echo.
echo 🎯 启动选项：
echo 1. 启动开发服务器（前后端）
echo 2. 仅启动后端API
echo 3. 仅启动前端
echo 4. 退出

set /p choice=请选择 (1-4): 

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto exit

echo ❌ 无效选择
pause
exit /b 1

:start_all
echo 🚀 启动完整开发环境...

REM 启动后端
echo 🔧 启动后端服务器...
start "后端服务器" cmd /k "cd backend && npm run dev"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
echo 🎨 启动前端开发服务器...
start "前端服务器" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 系统启动完成！
echo 📱 前端地址: http://localhost:3000
echo 🔧 后端地址: http://localhost:5000
echo.
echo 请在新打开的窗口中查看服务状态
pause
goto exit

:start_backend
echo 🔧 启动后端API服务器...
cd backend
npm run dev
pause
goto exit

:start_frontend
echo 🎨 启动前端开发服务器...
cd frontend
npm run dev
pause
goto exit

:exit
echo 👋 退出
pause