# GitHub数据存储快速启动指南

## 🚀 三步快速启动（完全免费）

### 步骤1：创建GitHub仓库和获取Token

#### 1.1 创建GitHub仓库
1. 登录GitHub：https://github.com
2. 点击右上角"+" → "New repository"
3. 填写仓库信息：
   - Repository name: `my-blog-data`（或其他名称）
   - Description: "个人博客数据存储"
   - 选择 **Public**（免费）
   - 勾选"Add a README file"
4. 点击"Create repository"

#### 1.2 生成Personal Access Token
1. 点击头像 → **Settings**
2. 左侧菜单 → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. 点击"**Generate new token**" → "Generate new token (classic)"
5. 设置权限：
   - **Note**: "Blog Data Storage"
   - **Expiration**: 选择较长时间（如1年）
   - **Select scopes**: 勾选 **repo**（完全控制仓库）
6. 点击"**Generate token**"
7. **重要**：立即复制生成的token（只显示一次）

### 步骤2：配置环境变量

编辑 `backend/.env` 文件：

```env
# GitHub数据存储配置（取消注释并修改）
GITHUB_STORAGE_ENABLED=true
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_OWNER=your_github_username
GITHUB_REPO=my-blog-data
GITHUB_DATA_BRANCH=main

# 数据文件路径（保持默认）
GITHUB_POSTS_FILE=data/posts.json
GITHUB_USERS_FILE=data/users.json
GITHUB_FILES_FILE=data/files.json

# 注释掉其他数据库配置
# MONGODB_URI=mongodb://localhost:27017/blog
```

**替换以下值**：
- `your_github_username`：您的GitHub用户名
- `my-blog-data`：您创建的仓库名称
- `ghp_your_actual_token_here`：复制的Personal Access Token

### 步骤3：测试并启动

#### 3.1 测试GitHub存储
```bash
cd backend
node test-github-storage.js
```

#### 3.2 启动后端服务器
```bash
npm run dev
```

#### 3.3 启动前端应用（新开终端）
```bash
cd ..
npm run dev
```

#### 3.4 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000
- 健康检查：http://localhost:5000/api/health

## 💡 配置示例

### 完整的环境变量示例
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# GitHub数据存储配置
GITHUB_STORAGE_ENABLED=true
GITHUB_TOKEN=ghp_abc123def456ghi789jkl012mno345pqr678
GITHUB_OWNER=zhangsan
GITHUB_REPO=my-blog-data
GITHUB_DATA_BRANCH=main
GITHUB_POSTS_FILE=data/posts.json
GITHUB_USERS_FILE=data/users.json
GITHUB_FILES_FILE=data/files.json

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 前端URL
FRONTEND_URL=http://localhost:3000
```

## 🔧 故障排除

### 常见问题及解决方案

#### 错误："GitHub token not configured"
**原因**：未设置GITHUB_TOKEN环境变量
**解决**：检查`.env`文件中的GITHUB_TOKEN配置

#### 错误："Bad credentials"或"401 Unauthorized"
**原因**：GitHub Token无效或过期
**解决**：重新生成Personal Access Token

#### 错误："Not Found"或"404"
**原因**：GitHub仓库不存在
**解决**：检查GITHUB_OWNER和GITHUB_REPO配置

#### 错误："API rate limit exceeded"
**原因**：GitHub API速率限制
**解决**：等待1小时或使用更少的请求

### 测试命令

```bash
# 检查Node.js环境
node --version
npm --version

# 检查环境变量配置
cd backend
cat .env | grep GITHUB

# 运行完整测试
node test-github-storage.js

# 健康检查
curl http://localhost:5000/api/health
```

## 🌟 GitHub存储的优势

### ✅ 完全免费
- 公开仓库：无限存储
- 无需信用卡
- 全球CDN加速

### ✅ 版本控制
- 自动记录所有数据变更
- 可回滚到任意版本
- 完整的修改历史

### ✅ 高可靠性
- GitHub 99.9% SLA
- 自动备份
- 全球多副本

### ✅ 易于管理
- 网页界面查看数据
- 分支管理
- 协作功能

## 📊 数据存储结构

您的数据将存储在GitHub仓库中：

```
my-blog-data/
├── data/
│   ├── posts.json      # 博客文章
│   ├── users.json      # 用户信息
│   └── files.json      # 文件记录
└── README.md
```

### 数据文件示例

**posts.json**
```json
[
  {
    "id": "123456789",
    "title": "我的第一篇博客",
    "content": "文章内容...",
    "author": "user123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "views": 100,
    "likes": 10
  }
]
```

## 🛡️ 安全注意事项

### Token安全
- **不要提交**Token到代码仓库
- 使用环境变量存储
- 定期轮换Token

### 数据安全
- 敏感信息加密存储
- 定期检查仓库权限
- 启用双因素认证

### 备份策略
- 定期导出数据备份
- 使用GitHub的发布功能
- 本地备份重要数据

## 🔄 切换回MongoDB

如果需要切换回传统数据库：

1. 编辑 `backend/.env` 文件
2. 注释GitHub配置，取消注释MongoDB配置
3. 确保MongoDB服务运行
4. 重启服务器

```env
# 注释GitHub配置
# GITHUB_STORAGE_ENABLED=true
# GITHUB_TOKEN=...

# 取消注释MongoDB配置
MONGODB_URI=mongodb://localhost:27017/blog
```

## 📞 获取帮助

### 官方文档
- [GitHub REST API文档](https://docs.github.com/en/rest)
- [Personal Access Tokens指南](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

### 社区支持
- GitHub Issues
- Stack Overflow
- 项目文档

---

## 🎉 开始使用！

按照上述步骤配置，您的个人博客就可以使用完全免费的GitHub数据存储了！

**优势总结**：
- 💰 **完全免费** - 无需支付数据库费用
- 🔒 **安全可靠** - GitHub企业级基础设施
- 📚 **版本控制** - 完整的数据变更历史
- 🌍 **全球访问** - 就近CDN加速

祝您使用愉快！🚀