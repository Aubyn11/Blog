# 云端部署个人博客 - 部署指南

## 项目概述

本项目是一个现代化的个人博客系统，采用前后端分离架构，支持本地文件上传和云端部署。

## 系统要求

### 开发环境
- Node.js 16.0+ 
- npm 7.0+ 或 yarn 1.22+
- Git
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 生产环境
- 前端部署: Vercel, Netlify, AWS S3 + CloudFront
- 后端部署: AWS EC2, Heroku, Vercel Functions
- 数据库: MongoDB Atlas
- 文件存储: AWS S3, Cloudinary

## 快速开始

### 1. 环境准备

```bash
# 检查Node.js版本
node --version

# 检查npm版本  
npm --version

# 如果没有安装Node.js，请从官网下载安装
# https://nodejs.org/
```

### 2. 安装依赖

```bash
# 进入项目目录
cd D:\Blog

# 安装前端依赖
npm install

# 安装后端依赖（如果后端代码存在）
cd backend
npm install
```

### 3. 开发环境配置

#### 前端环境变量
创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=个人博客
```

#### 后端环境变量（如果使用）
创建 `backend/.env` 文件：

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=your-jwt-secret-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### 4. 启动开发服务器

```bash
# 启动前端开发服务器
npm run dev

# 启动后端开发服务器（如果后端代码存在）
cd backend
npm run dev
```

访问 http://localhost:3000 查看前端应用

## 生产环境部署

### 方案一：Vercel 部署（推荐）

#### 前端部署到 Vercel

1. **准备部署配置**
   ```bash
   # 构建项目
   npm run build
   ```

2. **创建 vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

3. **部署步骤**
   - 将代码推送到 GitHub
   - 在 Vercel 中导入项目
   - 配置环境变量
   - 自动部署

#### 后端部署到 Vercel Functions

创建 `api` 目录并配置 serverless functions。

### 方案二：传统服务器部署

#### 前端部署

1. **构建生产版本**
   ```bash
   npm run build
   ```

2. **部署到静态服务器**
   - 将 `dist` 目录上传到 Web 服务器
   - 配置 Nginx/Apache
   - 设置 HTTPS

#### 后端部署

1. **准备生产环境**
   ```bash
   cd backend
   npm run build
   ```

2. **使用 PM2 管理进程**
   ```bash
   # 安装 PM2
   npm install -g pm2
   
   # 启动应用
   pm2 start dist/index.js --name "blog-api"
   
   # 设置开机自启
   pm2 startup
   pm2 save
   ```

3. **Nginx 配置**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /var/www/blog/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # API 代理
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 方案三：Docker 部署

#### Dockerfile 配置

**前端 Dockerfile**
```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**后端 Dockerfile**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:80"
    depends_on:
      - backend
    
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/blog
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongo
    
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## 数据库配置

### MongoDB Atlas（推荐）

1. 注册 MongoDB Atlas 账户
2. 创建集群
3. 获取连接字符串
4. 配置网络访问白名单
5. 创建数据库用户

### 本地 MongoDB

```bash
# 安装 MongoDB
# Windows: 下载安装包
# macOS: brew install mongodb-community
# Ubuntu: apt install mongodb

# 启动服务
mongod --dbpath /path/to/data
```

## 文件存储配置

### AWS S3 配置

1. 创建 AWS 账户
2. 创建 S3 存储桶
3. 配置 CORS 策略
4. 创建 IAM 用户和访问密钥
5. 设置存储桶策略

### Cloudinary 配置（替代方案）

1. 注册 Cloudinary 账户
2. 获取 API 密钥
3. 配置上传预设

## 域名和 SSL 配置

### 域名配置

1. 购买域名
2. 配置 DNS 解析
3. 设置 CNAME/A 记录

### SSL 证书

- Let's Encrypt（免费）
- 云服务商提供的证书
- 商业 SSL 证书

## 监控和日志

### 前端监控
- Google Analytics
- Sentry（错误监控）
- LogRocket（用户会话重放）

### 后端监控
- PM2 监控
- 应用日志
- 性能监控

### 数据库监控
- MongoDB Atlas 监控
- 查询性能分析

## 备份策略

### 数据库备份

```bash
# MongoDB 备份
mongodump --uri="mongodb://username:password@host:port/database" --out=backup/

# 自动备份脚本
0 2 * * * /usr/bin/mongodump --uri="your-connection-string" --out=/backup/$(date +%Y%m%d)
```

### 文件备份
- S3 版本控制
- 定期快照
- 跨区域复制

## 安全配置

### 前端安全
- CSP（内容安全策略）
- HTTPS 强制
- XSS 防护

### 后端安全
- 输入验证
- SQL 注入防护
- 速率限制
- JWT 令牌安全

### 服务器安全
- 防火墙配置
- SSH 密钥认证
- 定期安全更新

## 性能优化

### 前端优化
- 代码分割
- 图片优化
- 缓存策略
- CDN 加速

### 后端优化
- 数据库索引
- 查询优化
- 缓存层（Redis）
- 负载均衡

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 清理 node_modules 重新安装
   - 检查依赖冲突

2. **部署失败**
   - 检查环境变量配置
   - 查看部署日志
   - 验证文件权限

3. **数据库连接失败**
   - 检查连接字符串
   - 验证网络访问
   - 检查防火墙设置

4. **文件上传失败**
   - 检查存储服务配置
   - 验证文件大小限制
   - 检查 CORS 设置

### 日志查看

```bash
# PM2 日志
pm2 logs blog-api

# Nginx 日志
tail -f /var/log/nginx/error.log

# 系统日志
journalctl -u nginx
```

## 扩展功能

### 后续可添加的功能
- 评论系统
- 邮件订阅
- 社交分享
- 多语言支持
- 搜索功能
- 主题切换

### 技术扩展
- 微服务架构
- GraphQL API
- 实时通知
- 移动端应用

---

## 总结

本项目提供了完整的个人博客解决方案，具备现代化的技术栈和良好的扩展性。通过本指南，您可以快速部署和运维您的个人博客系统。

如有问题，请参考项目文档或联系技术支持。