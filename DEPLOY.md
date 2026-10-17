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

---

## 七、视频上传（R2）—— 可选

### 7.1 不配也能用

视频块默认是「手动填 URL」。你先把视频传到 B站 / 网盘 / 任何能拿到直链的地方，把 mp4 地址粘进 `视频 URL` 就行。

### 7.2 配了之后的效果

后台「视频」组件的属性面板里会多一个 **上传视频** 按钮，选文件后显示进度条，传完自动填入地址。

**为什么是浏览器直传**：Vercel Serverless Function 的请求体上限是 4.5MB，几十 MB 的视频传不进来。所以后端只签发一个 15 分钟有效的上传地址（预签名 URL），文件由浏览器直接 PUT 到 R2。Vercel 只承担一次几十 KB 的签名请求。

### 7.3 开通步骤

1. **装依赖**（必须先做，否则上传按钮报了「依赖未安装」）

   ```powershell
   cd F:\Blog
   npm install
   ```

   新增了两个包：`@aws-sdk/client-s3`、`@aws-sdk/s3-request-presigner`。

2. **建桶**：Cloudflare 控制台 → R2 → Create bucket → 名字 `blog-media`

3. **开公开访问**：bucket → Settings → Public access → 绑定一个自定义域名（如 `media.你的域名.com`）
   - 只是自己测试的话，可以先用 R2 提供的 `https://pub-xxxx.r2.dev`
   - 正式用建议绑自定义域名，否则 r2.dev 有速率限制

4. **建 API Token**：R2 → Manage R2 API Tokens → Create API token
   - Permissions：`Object Read & Write`
   - 限定到 `blog-media` 这一个桶
   - 记下 **Access Key ID**、**Secret Access Key**、以及账户页的 **Account ID**

5. **配 CORS**（bucket → Settings → CORS Policy）：

   ```json
   [
     {
       "AllowedOrigins": ["https://你的站点域名.vercel.app", "http://localhost:5173"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

6. **加 5 个环境变量**（Vercel → Settings → Environment Variables）：

   | 变量名 | 值 |
   |---|---|
   | `R2_ACCOUNT_ID` | Cloudflare 账户 ID |
   | `R2_ACCESS_KEY_ID` | 第 4 步的 Access Key ID |
   | `R2_SECRET_ACCESS_KEY` | 第 4 步的 Secret Access Key |
   | `R2_BUCKET` | `blog-media` |
   | `R2_PUBLIC_BASE_URL` | `https://media.你的域名.com`（结尾不带斜杠） |

   加完 **Redeploy**。

### 7.4 怎么验证

- [ ] 访问 `/api/uploads/config`，`enabled` 应该是 `true`
- [ ] 后台新建页面 → 拖一个「视频」组件 → 点「上传视频」→ 选个 mp4
- [ ] 进度条走完，预览能播放，视频 URL 自动填上
- [ ] 打开那个 URL（形如 `https://media.你的域名.com/videos/2026/10/xxxx-a.mp4`）能直接播

### 7.5 出问题看这里

| 现象 | 原因 |
|---|---|
| 按钮是灰的，提示未配置 | 5 个环境变量没填全，或没 Redeploy |
| 上传到 99% 失败 | CORS 的 `AllowedOrigins` 里没有你当前访问的域名 |
| 报 `SignatureDoesNotMatch` | 浏览器 PUT 时的 Content-Type 和签发时不一致（代码已固定，一般是代理改了请求头） |
| 报 `Request body too large` | 你在填 URL 而不是用上传按钮，走了后端转发 |
| 上传成功但播放 404 | `R2_PUBLIC_BASE_URL` 写错，或桶没开公开访问 |

### 7.6 上传限制（代码里写死的）

| 类型 | 格式 | 单文件上限 |
|---|---|---|
| 视频 | mp4 / webm / mov | 200 MB |
| 图片 | jpg / png / webp / gif | 10 MB |

需要改的话在 `backend/src/services/r2Storage.js` 顶部的 `LIMITS` 和 `VIDEO_TYPES`。
