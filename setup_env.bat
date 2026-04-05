@echo off
chcp 65001 >nul

echo 🚀 设置Node.js环境变量...

REM 临时设置环境变量
set PATH=C:\Program Files\nodejs;%PATH%

echo ✅ Node.js版本:
"C:\Program Files\nodejs\node.exe" --version

echo ✅ npm版本:
"C:\Program Files\nodejs\npm.cmd" --version

echo.
echo 📦 开始安装项目依赖...

REM 安装前端依赖
echo 🔧 安装前端依赖...
cd frontend
call "C:\Program Files\nodejs\npm.cmd" install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)

REM 安装后端依赖
echo 🔧 安装后端依赖...
cd ..\backend
call "C:\Program Files\nodejs\npm.cmd" install
if errorlevel 1 (
    echo ❌ 后端依赖安装失败
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ 依赖安装完成！
echo.
echo 🎯 下一步操作：
echo 1. 确保MongoDB服务正在运行
echo 2. 运行 start.bat 启动系统
echo 3. 访问 http://localhost:3000
echo.

pause