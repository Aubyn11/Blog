# 项目分析与变更记录

## 项目概览

**技术栈**
- 前端：React 18 + TypeScript + Vite + TailwindCSS + Tiptap
- 后端：Express.js + Node.js + JWT 认证
- 存储：MongoDB（默认）/ GitHub API（可选）
- 部署：Vercel Serverless

---

## 痛点分析（2026-04-05）

### 🔴 P0 — 严重问题（立即修复）

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 1 | **文章编辑器退化为纯文本框** | `src/pages/Admin/PostEditor.tsx` | 已安装 Tiptap 但完全未使用，无工具栏、无预览、无代码高亮 |
| 2 | **内容渲染不安全** | `src/pages/Blog/Blog.tsx` | `dangerouslySetInnerHTML` 直接渲染原始内容，Markdown 未解析，存在 XSS 风险 |
| 3 | **速率限制被注释** | `backend/src/index.js` | 登录/注册接口无防暴力破解保护 |
| 4 | **调试接口无访问控制** | `backend/src/index.js` | `/api/debug/env` 暴露配置状态，无任何鉴权 |
| 5 | **博客列表无分页** | `src/pages/Blog/Blog.tsx` | 写死 `limit: 12`，无分页/无限滚动 |

### 🟡 P1 — 中等问题（近期规划）

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 6 | **点赞无防重复机制** | 后端 likePost | 任何人可无限点赞，无用户去重 |
| 7 | **Token 无刷新机制** | `src/contexts/AuthContext.tsx` | JWT 7天过期后直接失效，无 refresh token |
| 8 | **UserHome 快捷导航无效** | `src/pages/UserHome/UserHome.tsx` | 三个卡片全部指向同一链接 |
| 9 | **GitHub 存储无缓存** | `backend/src/services/githubStorage.js` | 每次请求都调用 GitHub API，N用户=N次串行请求 |
| 10 | **无评论系统** | 全局 | 博客无评论功能 |

### 🟢 P2 — 功能增强（中期规划）

| # | 功能 | 说明 |
|---|------|------|
| 11 | **文章目录(TOC)** | 文章详情页右侧浮动目录导航 |
| 12 | **SEO 优化** | 动态 `<title>` 和 `<meta description>`，考虑预渲染 |
| 13 | **RSS 订阅** | 生成 RSS Feed 供读者订阅 |
| 14 | **暗色模式** | TailwindCSS 已支持 `dark:` 前缀，添加主题切换 |
| 15 | **全文搜索增强** | 当前为内存过滤，可接入 Algolia 或 MeiliSearch |
| 16 | **图片 CDN 优化** | 上传图片自动压缩 + WebP 转换 |
| 17 | **访问统计仪表盘** | Dashboard 增加真实数据图表（阅读量趋势等）|

### 🔵 P3 — 长期规划

| # | 功能 | 说明 |
|---|------|------|
| 18 | **文章系列/专栏** | 将相关文章组织成系列 |
| 19 | **多语言(i18n)** | 国际化支持 |
| 20 | **PWA 支持** | 离线访问、推送通知 |
| 21 | **邮件通知** | 新评论/新关注者邮件提醒 |
| 22 | **导入/导出** | 支持从 Hexo/Hugo/WordPress 导入文章 |

---

## 变更记录

### v1.1.0 — 2026-04-05（P0 修复）

#### ✅ 已完成

**1. 文章编辑器升级（PostEditor.tsx）**
- 接入 Tiptap 富文本编辑器，支持加粗、斜体、标题、列表、引用、代码块等
- 新增编辑/预览双模式切换
- 编辑模式：Tiptap 富文本工具栏
- 预览模式：使用 `marked` + `DOMPurify` 安全渲染 Markdown

**2. 内容渲染安全修复（Blog.tsx）**
- 引入 `marked` 解析 Markdown 语法
- 引入 `DOMPurify` 消毒 HTML，防止 XSS 注入
- 文章详情页正确渲染 Markdown 格式内容

**3. 速率限制开启（backend/src/index.js）**
- 开启认证接口速率限制：15分钟内最多 10 次请求
- 开启通用 API 速率限制：1分钟内最多 60 次请求
- 开启全局速率限制：15分钟内最多 200 次请求

**4. 调试接口保护（backend/src/index.js）**
- `/api/debug/env` 接口增加环境检查，仅在 `NODE_ENV=development` 时可访问

**5. 博客列表分页（Blog.tsx）**
- 新增分页组件，支持上一页/下一页导航
- 显示当前页码和总页数
- 每页显示 9 篇文章

### v1.2.0 — 2026-04-05（P1 修复）

#### ✅ 已完成

**6. 点赞去重（githubPostController.js + Blog.tsx）**
- GitHub 模式：新增 `likedBy` 数组存储已点赞用户标识（登录用户ID / IP），支持取消点赞
- 写操作后调用 `invalidateCache()` 使缓存失效，保证数据一致性
- 前端文章详情页：点赞按钮带交互状态（红心填充/空心切换），`localStorage` 记录本地去重状态
- MongoDB 模式原本已有 `likes` 数组去重，无需修改

**7. Token 自动续期（AuthContext.tsx）**
- 新增 `parseJwtExp()` 解析 JWT 过期时间（无需后端支持）
- 应用启动时检测 Token 是否已过期，过期则立即清除
- 登录/启动后设置定时器，在 Token 过期前 **5 分钟** 静默调用 `/auth/me` 重新验证
- 验证失败时自动登出，组件卸载时清除定时器防止内存泄漏

**8. UserHome 快捷导航修复（UserHome.tsx + Blog.tsx）**
- 三个卡片分别指向不同链接：
  - 「全部文章」→ `/blog?userId=xxx`
  - 「分类标签」→ `/blog?userId=xxx#tags`（自动滚动到标签筛选区）
  - 「最新发布」→ `/blog?userId=xxx&sort=latest`
- `Blog.tsx` 新增读取 URL 参数（`userId`、`sort`、`#tags` 锚点）
- 标签区域添加 `id="tags"` 锚点，支持从外部链接直接滚动定位

**9. GitHub 存储缓存（githubPostController.js）**
- 新增内存缓存层：`getCachedAllPosts()`，TTL **5 分钟**
- 全站文章列表、文章详情查找、搜索、权限校验均使用缓存
- 创建/更新/删除/点赞操作后调用 `invalidateCache()` 使缓存失效
- 效果：10 个用户的博客首页加载从 ~10s 降至 ~1s（缓存命中时）

---



```
D:/Blog/
├── src/                    # 前端 React + TypeScript
│   ├── pages/
│   │   ├── Admin/          # 后台管理
│   │   │   └── PostEditor.tsx   # 文章编辑器（已升级 Tiptap）
│   │   ├── Blog/           # 博客前台
│   │   │   └── Blog.tsx         # 文章列表+详情（已修复渲染+分页）
│   │   ├── Home/           # 首页
│   │   └── UserHome/       # 用户主页
│   ├── services/           # API 服务层
│   ├── contexts/           # React Context（认证等）
│   └── types/              # TypeScript 类型定义
├── backend/                # 后端 Express.js
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务服务（GitHub存储等）
│   │   ├── middleware/     # 中间件
│   │   └── index.js        # 入口文件（已修复速率限制）
│   └── package.json
└── package.json
```
