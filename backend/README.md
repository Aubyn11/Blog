# 个人博客后端API

这是个人博客系统的后端API服务器，提供用户认证、文章管理、文件上传等功能。

## 功能特性

- ✅ 用户认证和授权（JWT）
- ✅ 文章管理（创建、编辑、删除、发布）
- ✅ 文件上传和管理
- ✅ 用户管理（管理员功能）
- ✅ 数据验证和错误处理
- ✅ 安全中间件（CORS、Helmet、速率限制）
- ✅ 数据库索引优化
- ✅ 文件类型和大小限制

## 技术栈

- **运行时**: Node.js 16.0+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT + bcryptjs
- **文件上传**: Multer
- **安全**: Helmet, CORS, 速率限制
- **开发工具**: Nodemon

## 快速开始

### 1. 环境要求

- Node.js 16.0+
- MongoDB 4.4+
- npm 7.0+

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 环境配置

复制 `.env` 文件并根据需要修改配置：

```bash
# 复制环境变量文件
cp .env.example .env
```

### 4. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# 使用本地MongoDB
mongod --dbpath /path/to/data

# 或使用MongoDB Atlas云数据库
# 修改 .env 中的 MONGODB_URI
```

### 5. 启动开发服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 http://localhost:5000 运行

## API文档

### 认证相关

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "Password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 文章管理

#### 获取文章列表
```http
GET /api/posts?page=1&limit=10&search=关键字&tag=标签
```

#### 创建文章
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "文章标题",
  "content": "文章内容",
  "excerpt": "文章摘要",
  "tags": "标签1,标签2",
  "status": "draft",
  "coverImage": <文件>
}
```

#### 更新文章
```http
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### 删除文章
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

### 文件管理

#### 上传文件
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <文件>,
  "description": "文件描述"
}
```

#### 获取文件列表
```http
GET /api/files?page=1&limit=20&type=image
Authorization: Bearer <token>
```

## 数据库模型

### User（用户）
- username: 用户名（唯一）
- email: 邮箱（唯一）
- password: 加密密码
- avatar: 头像URL
- role: 角色（admin/user）
- bio: 个人简介
- isActive: 是否激活

### Post（文章）
- title: 标题
- content: 内容
- excerpt: 摘要
- coverImage: 封面图片
- tags: 标签数组
- author: 作者ID
- status: 状态（published/draft）
- views: 阅读量
- likes: 点赞用户数组
- meta: 元数据（阅读时间、字数）

### File（文件）
- filename: 文件名
- originalName: 原始文件名
- mimetype: 文件类型
- size: 文件大小
- url: 文件URL
- uploadedBy: 上传者
- description: 文件描述
- isPublic: 是否公开

## 安全特性

### 1. 密码安全
- 使用 bcryptjs 加密密码
- 密码强度验证
- 密码重置功能

### 2. JWT认证
- 令牌过期机制
- 令牌刷新策略
- 安全的令牌存储

### 3. 输入验证
- Express Validator 数据验证
- XSS 防护
- SQL 注入防护

### 4. 安全中间件
- Helmet 安全头设置
- CORS 跨域配置
- 速率限制防刷
- 压缩和缓存控制

### 5. 文件安全
- 文件类型白名单
- 文件大小限制
- 病毒扫描集成
- 访问权限控制

## 部署指南

### 开发环境部署

1. 安装依赖：`npm install`
2. 配置环境变量：修改 `.env`
3. 启动数据库：确保 MongoDB 运行
4. 启动服务器：`npm run dev`

### 生产环境部署

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/index.js --name "blog-api"

# 设置开机自启
pm2 startup
pm2 save
```

#### 使用 Docker

创建 `Dockerfile`：

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "src/index.js"]
```

构建和运行：

```bash
docker build -t blog-api .
docker run -p 5000:5000 --env-file .env blog-api
```

#### 云平台部署

- **Vercel**: 支持 serverless 函数部署
- **Heroku**: 简单的 Git 部署
- **AWS EC2**: 完全控制服务器环境
- **DigitalOcean**: 性价比高的云服务器

## 监控和日志

### 应用监控

```bash
# 使用 PM2 监控
pm2 monit

# 查看日志
pm2 logs blog-api
```

### 性能监控

- 使用 New Relic 或 DataDog
- 自定义性能指标
- 错误追踪集成

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 MongoDB 服务状态
   - 验证连接字符串
   - 检查网络连接

2. **JWT令牌无效**
   - 检查令牌是否过期
   - 验证 JWT_SECRET 配置
   - 检查令牌格式

3. **文件上传失败**
   - 检查文件大小限制
   - 验证文件类型
   - 检查磁盘空间

4. **CORS错误**
   - 检查 FRONTEND_URL 配置
   - 验证请求头设置
   - 检查浏览器安全策略

### 日志调试

启用详细日志：

```javascript
// 在 .env 中设置
DEBUG=blog:*
NODE_ENV=development
```

## 扩展功能

### 计划中的功能

- [ ] 评论系统
- [ ] 邮件通知
- [ ] 搜索优化
- [ ] 缓存策略
- [ ] 实时通知
- [ ] 多语言支持

### 技术改进

- [ ] GraphQL API
- [ ] 微服务架构
- [ ] 消息队列
- [ ] 容器编排
- [ ] 自动伸缩

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系开发团队。