# 部署清单（F:\Blog）

> 照着点、照着粘贴即可，不需要理解全部内容。
> ✅ = 我已做完并验证；👤 = 只有你能做（要登录网页）。

---

## 一、我已经做完并验证过的

| 项目 | 结果 |
|---|---|
| 项目复制到 F 盘 | ✅ 40,644 个文件、428.26 MB，与 D 盘逐字节一致 |
| git 仓库完整性 | ✅ 分支 `master`、commit `ec4099b`、工作区干净 |
| 前端生产构建 | ✅ `vite build` 6.17 秒，产出 `dist/`（806 KB JS） |
| Serverless 入口可加载 | ✅ 在**只用根目录依赖**的条件下导入 `api/index.js` 成功——这正是 Vercel 的安装方式 |
| 后端路由连通性 | ✅ 起服务实测 `/api/health` 返回 200，路由已挂载 |
| bug 修复 | ✅ 未知路由原本返回 500，现在正确返回 404 |
| 密钥是否泄漏 | ✅ 仓库只跟踪 `.env.example`，`backend/.env` 已被 `.gitignore` 排除 |

**结论：代码层面已经具备上线条件，剩下全是「账号配置」。**

---

## 二、你只需要做 5 件事（约 30 分钟）

### 第 1 步 👤 建一个「数据仓库」

网址：https://github.com/new

- Repository name：`blog-data`
- 可见性：**Private**
- 勾选 `Add a README file`
- 点 Create repository

> 为什么要单独一个仓库：文章、用户、配置都会以 JSON 形式写进这个仓库。
> 如果写进 `Blog` 代码仓，每发一篇文章都会触发一次重新部署，又慢又费额度。

### 第 2 步 👤 生成访问令牌

网址：https://github.com/settings/tokens?type=beta

1. 点 **Generate new token**
2. Token name：`blog-vercel`
3. Expiration：`No expiration`（或 1 年，到期记得换）
4. **Repository access** → 选 `Only select repositories` → 只勾 `blog-data`
5. **Permissions** → 展开 `Repository permissions` → 找到 `Contents` → 改成 **Read and write**
6. 点 Generate，把 `github_pat_...` 复制下来（**只显示一次**）

### 第 3 步 👤 把代码推到 GitHub

打开**你自己的** PowerShell（不是我这个窗口），粘贴：

```powershell
cd F:\Blog
git status
git add -A
git commit -m "fix: 404 状态码修正；部署配置整理"
git push origin master
```

- 提示要登录：选 `Sign in with your browser`，弹窗登录一次即可
- 报 `rejected`：先跑 `git pull --rebase origin master` 再 push

### 第 4 步 👤 在 Vercel 导入项目

网址：https://vercel.com/new

1. 选 `Aubyn11/Blog` → Import
2. 设置：

| 字段 | 填什么 |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | `./`（默认，不要改） |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

3. **先不要点 Deploy**，展开 Environment Variables，先填第 5 步的表

### 第 5 步 👤 填环境变量

逐条添加（Production + Preview 都勾）：

| 变量名 | 值 | 说明 |
|---|---|---|
| `GITHUB_STORAGE_ENABLED` | `true` | **最关键**。不设这个，它会去找 MongoDB |
| `GITHUB_TOKEN` | `github_pat_...` | 第 2 步拿到的 |
| `GITHUB_OWNER` | `Aubyn11` | 你的用户名 |
| `GITHUB_REPO` | `blog-data` | 第 1 步建的仓库 |
| `GITHUB_DATA_BRANCH` | `main` | 数据仓的分支 |
| `JWT_SECRET` | 32 位以上随机字符 | 登录凭证签名，别用示例值 |
| `JWT_EXPIRES_IN` | `7d` | 登录有效期 |
| `FRONTEND_URL` | `https://你的域名.vercel.app` | **必须和实际访问地址完全一致**，否则接口被 CORS 拦掉 |
| `NODE_ENV` | `production` | |

填完点 **Deploy**，等 1–2 分钟。

---

## 三、上线后按这个顺序验收

- [ ] 打开 `https://xxx.vercel.app/api/health`
      应看到 `{"status":"OK","storage":{"mode":"github",...}}`
      - `mode` 是 `mongodb` → `GITHUB_STORAGE_ENABLED` 没生效，检查后 **Redeploy**
      - 返回 500 → 看 Vercel 的 Runtime Logs，多半是 token 或仓库名填错
- [ ] 打开 `https://xxx.vercel.app/api/debug/env`
      各项应显示 `✅ 已设置`，`GITHUB_STORAGE_ENABLED` 为 `true`
- [ ] 打开首页，能正常显示
- [ ] 去 `/register`（或登录页）注册第一个账号 —— 这个账号就是管理员
- [ ] 进后台 → 新建一篇文章 → 保存
- [ ] 回到 `https://github.com/Aubyn11/blog-data`，`data/` 下应新增 JSON 文件
- [ ] 刷新博客首页，文章出现了

---

## 四、可能会踩的 4 个坑

### 坑 1：构建失败，报 `builds` 相关错误

`vercel.json` 用的是老式 `builds` 写法，个别情况下会和新版构建器打架。

**处理**：把 `vercel.json` 里的 `"builds"` 整段删掉，**只保留 `rewrites` 和 `headers`**，再重新部署。
`api/` 目录会被 Vercel 自动识别成函数，不需要 `builds` 声明。

### 坑 2：页面能开，但所有接口 404

说明 `api/index.js` 没被识别成函数。
**检查**：Vercel 项目 → Settings → Functions，看有没有 `/api/index`。

### 坑 3：接口全被 CORS 拦

控制台报 `CORS policy: origin ... not allowed`。
**原因**：`FRONTEND_URL` 和实际域名不一致（多/少 `www`、`https` 写成 `http`、带尾斜杠都不行）。
**处理**：改成完全一致的地址，再 Redeploy。

### 坑 4：注册后登录不上 / 刷新就掉登录

检查 `JWT_SECRET` 是否设置。Vercel 每次部署换容器，没有固定 secret 会导致 token 校验失败。

---

## 五、还没做的（等你说要不要）

- [ ] 视频文件怎么存：目前「视频块」填的是 URL，需要先把视频传到 B站 / Cloudflare R2 再填地址
- [ ] 自定义域名（现在先用 `xxx.vercel.app`）
- [ ] `D:\Blog` 旧目录删除（等 F 盘这套跑通了再删）

---

## 六、常用命令（复制备用）

```powershell
# 本地起前端
cd F:\Blog
npm run dev

# 本地起后端（另开一个窗口）
cd F:\Blog\backend
npm run dev

# 只检查能不能构建
cd F:\Blog
npm run build

# 看当前改动
cd F:\Blog
git status --short
```
