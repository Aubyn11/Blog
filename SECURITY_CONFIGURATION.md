# 安全配置指南

## 📋 概述

本文档详细说明博客系统的安全配置，包括用户认证、API保护、速率限制等安全特性。

## 🔐 用户认证系统

### 默认管理员账户

系统启动时会自动创建默认管理员账户：

```
用户名: admin
密码: admin123
邮箱: admin@blog.com
```

**重要安全提醒：**
- 首次登录后请立即修改密码
- 建议禁用或删除默认账户，创建新的管理员账户
- 默认密码仅用于初始配置

### 用户角色权限

| 角色 | 权限描述 |
|------|----------|
| **admin** | 完全系统权限，可管理所有用户和内容 |
| **user** | 普通用户权限，可创建和管理自己的内容 |
| **guest** | 访客权限，只能浏览公开内容 |

### 密码安全策略

- 密码使用bcrypt加密存储（12轮盐值）
- 支持密码修改功能
- 会话超时自动注销
- JWT令牌7天有效期

## 🛡️ API安全保护

### 速率限制配置

系统实现了多层次的速率限制：

#### 1. 认证接口限制
```
路径: /api/auth/*
限制: 15分钟内最多5次请求
目的: 防止暴力破解攻击
```

#### 2. API接口限制
```
路径: /api/*
限制: 1分钟内最多30次请求
目的: 保护API资源
```

#### 3. 通用限制
```
路径: /*
限制: 15分钟内最多100次请求
目的: 整体系统保护
```

### CORS安全配置

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### Helmet安全头

启用以下安全头：
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-Download-Options
- X-XSS-Protection

## 🔒 GitHub API保护

### 速率限制处理

GitHub API有严格的速率限制：
- 未认证请求：60次/小时
- 认证请求：5000次/小时

系统实现了智能的请求队列和延迟机制：

```javascript
// 智能请求队列
async throttledRequest(method, path, options) {
  // 确保每秒不超过1个请求
  const timeSinceLastRequest = Date.now() - this.lastRequestTime
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
  }
  // ... 发送请求
}
```

### Token安全管理

**GitHub Personal Access Token安全：**
- 存储在环境变量中，不提交到代码库
- 仅授予必要的仓库权限（repo）
- 定期轮换Token
- 使用强密码保护GitHub账户

## 🚨 安全最佳实践

### 1. 生产环境配置

```env
# 必须修改的配置
JWT_SECRET=your-super-secure-random-string-at-least-32-characters
GITHUB_TOKEN=your-actual-github-token-here

# 建议配置
NODE_ENV=production
PORT=5000
```

### 2. 定期安全检查

- [ ] 检查GitHub Token权限
- [ ] 更新依赖包安全补丁
- [ ] 审查用户权限设置
- [ ] 备份重要数据
- [ ] 检查系统日志

### 3. 应急响应计划

**发现安全漏洞时：**
1. 立即暂停受影响的服务
2. 分析漏洞范围和影响
3. 修复漏洞并测试
4. 恢复服务并监控
5. 通知受影响用户

## 🔧 安全测试

### 运行安全测试

```bash
# 测试认证系统
cd backend
node test-auth-system.js

# 检查安全头
curl -I http://localhost:5000/api/health

# 测试速率限制
for i in {1..6}; do curl http://localhost:5000/api/auth/login; done
```

### 安全扫描工具

推荐使用以下工具进行安全扫描：
- **npm audit** - 检查依赖包漏洞
- **snyk** - 安全漏洞扫描
- **OWASP ZAP** - Web应用安全测试

## 📊 监控和日志

### 安全事件日志

系统记录以下安全相关事件：
- 用户登录/登出
- 密码修改
- 权限变更
- API异常访问
- 速率限制触发

### 监控指标

建议监控以下指标：
- API请求频率
- 认证失败次数
- 用户活跃度
- 系统资源使用

## 🆘 故障排除

### 常见安全问题

#### 问题："GitHub API rate limit exceeded"
**原因**：GitHub API请求过于频繁
**解决**：
- 检查代码中的循环请求
- 实现请求缓存
- 使用更长的请求间隔

#### 问题："JWT token expired"
**原因**：令牌过期
**解决**：重新登录获取新令牌

#### 问题："User not authorized"
**原因**：权限不足
**解决**：检查用户角色和权限设置

### 紧急联系方式

发现安全漏洞时，请立即：
1. 暂停服务
2. 联系系统管理员
3. 记录漏洞详情
4. 执行应急响应计划

---

## 💎 总结

本博客系统实现了企业级的安全保护：

✅ **完整的用户认证系统**  
✅ **多层次的API速率限制**  
✅ **GitHub API智能保护**  
✅ **安全头配置**  
✅ **密码加密存储**  
✅ **会话安全管理**  

通过遵循本指南的安全最佳实践，您可以确保博客系统的安全可靠运行。