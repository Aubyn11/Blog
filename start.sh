#!/bin/bash

# 个人博客系统启动脚本

echo "🚀 启动个人博客系统..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 创建必要的目录
mkdir -p backend/uploads

echo "📦 安装前端依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi

echo "📦 安装后端依赖..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi

cd ..

echo "🔧 检查环境配置..."

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
    cp .env.example .env
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  未找到后端 .env 文件，使用默认配置"
    cp backend/.env.example backend/.env
fi

echo "✅ 环境配置检查完成"

# 询问是否启动MongoDB
read -p "是否启动 MongoDB 服务？(y/n): " start_mongo

if [ "$start_mongo" = "y" ] || [ "$start_mongo" = "Y" ]; then
    echo "🗄️  启动 MongoDB..."
    
    # 检查MongoDB是否已安装
    if command -v mongod &> /dev/null; then
        # 创建数据目录
        mkdir -p data/db
        
        # 启动MongoDB（后台运行）
        mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
        
        if [ $? -eq 0 ]; then
            echo "✅ MongoDB 启动成功"
        else
            echo "⚠️  MongoDB 启动失败，请确保端口27017未被占用"
        fi
    else
        echo "⚠️  MongoDB 未安装，请手动启动或使用 MongoDB Atlas"
    fi
fi

echo ""
echo "🎯 启动选项："
echo "1. 启动开发服务器（前后端）"
echo "2. 仅启动后端API"
echo "3. 仅启动前端"
echo "4. 退出"

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "🚀 启动完整开发环境..."
        
        # 启动后端
        echo "🔧 启动后端服务器..."
        cd backend
        npm run dev &
        BACKEND_PID=$!
        
        # 等待后端启动
        sleep 3
        
        # 启动前端
        echo "🎨 启动前端开发服务器..."
        cd ../frontend
        npm run dev &
        FRONTEND_PID=$!
        
        echo ""
        echo "✅ 系统启动完成！"
        echo "📱 前端地址: http://localhost:3000"
        echo "🔧 后端地址: http://localhost:5000"
        echo ""
        echo "按 Ctrl+C 停止所有服务"
        
        # 等待用户中断
        wait $BACKEND_PID $FRONTEND_PID
        ;;
    2)
        echo "🔧 启动后端API服务器..."
        cd backend
        npm run dev
        ;;
    3)
        echo "🎨 启动前端开发服务器..."
        cd frontend
        npm run dev
        ;;
    4)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac