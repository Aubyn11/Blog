/**
 * @file initAdmin.js
 * @description 管理员初始化工具模块
 *
 * ============================================================
 * 📖 使用说明 (README)
 * ============================================================
 *
 * 【模块用途】
 *   本模块用于在博客系统首次启动时自动完成以下初始化工作：
 *   1. 检测并创建默认管理员账户
 *   2. 创建默认欢迎文章（如果还没有任何文章）
 *
 * 【何时会被调用】
 *   - 服务器启动时，app.js 会自动调用 runInitialization()
 *   - 只在数据为空时执行创建操作，已有数据不会被覆盖
 *
 * 【默认管理员账户】
 *   ┌─────────────┬──────────────────┐
 *   │ 用户名       │ admin            │
 *   │ 密码         │ admin123         │
 *   │ 邮箱         │ admin@blog.com   │
 *   │ 角色         │ admin            │
 *   └─────────────┴──────────────────┘
 *   ⚠️  重要：首次登录后请立即修改密码！
 *
 * 【导出的函数】
 *
 *   ① initAdminUser()
 *      - 检查 GitHub 数据存储中是否已存在 role=admin 的用户
 *      - 若不存在，则自动创建默认管理员账户
 *      - 返回：管理员用户对象
 *
 *   ② initDefaultData()
 *      - 检查是否已存在文章
 *      - 若没有任何文章，则创建一篇欢迎文章
 *
 *   ③ runInitialization()（默认导出）
 *      - 依次调用 initAdminUser() 和 initDefaultData()
 *      - 推荐在 app.js 启动时调用此函数
 *
 * 【使用示例】
 *
 *   // 方式一：使用默认导出（推荐，完整初始化）
 *   import runInitialization from './utils/initAdmin.js'
 *   await runInitialization()
 *
 *   // 方式二：单独初始化管理员
 *   import { initAdminUser } from './utils/initAdmin.js'
 *   const admin = await initAdminUser()
 *
 *   // 方式三：单独初始化默认数据
 *   import { initDefaultData } from './utils/initAdmin.js'
 *   await initDefaultData()
 *
 * 【注意事项】
 *   - 本模块依赖 GitHubStorage 服务，需确保环境变量已正确配置：
 *       GITHUB_TOKEN=your_github_token
 *       GITHUB_OWNER=your_github_username
 *       GITHUB_REPO=your_data_repo_name
 *   - 采用懒加载方式实例化 GitHubStorage，确保 dotenv 在此之前已加载
 *   - 密码使用 bcryptjs 加密（salt rounds = 12），安全存储
 *
 * ============================================================
 */

import GitHubStorage from '../services/githubStorage.js'
import bcrypt from 'bcryptjs'

// 懒加载：在第一次使用时才实例化，确保dotenv已加载
let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 初始化管理员用户
export const initAdminUser = async () => {
  try {
    console.log('🔧 检查管理员用户初始化...')
    
    const users = await getStorage().getUsers()
    
    // 检查是否已存在管理员用户
    const adminUser = users.find(user => user.role === 'admin')
    
    if (adminUser) {
      console.log('✅ 管理员用户已存在:', adminUser.username)
      return adminUser
    }
    
    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const newAdmin = await getStorage().createUser({
      username: 'admin',
      email: 'admin@blog.com',
      password: hashedPassword,
      displayName: '系统管理员',
      role: 'admin',
      isActive: true,
      bio: '系统默认管理员账户'
    })
    
    console.log('✅ 管理员用户创建成功:')
    console.log('   用户名: admin')
    console.log('   密码: admin123')
    console.log('   💡 请立即登录并修改密码！')
    
    return newAdmin
  } catch (error) {
    console.error('❌ 初始化管理员用户失败:', error.message)
    throw error
  }
}

// 初始化默认数据
export const initDefaultData = async () => {
  try {
    console.log('📊 初始化默认数据...')
    
    // 检查是否已存在文章
    const posts = await getStorage().getPosts()
    if (posts.length === 0) {
      // 创建欢迎文章
      const welcomePost = await getStorage().createPost({
        title: '欢迎使用个人博客系统',
        content: `# 欢迎使用个人博客系统\n\n这是一个基于GitHub数据存储的个人博客系统，具有以下特性：\n\n## 🚀 功能特性\n\n- ✅ **完全免费** - 使用GitHub仓库存储数据\n- ✅ **用户认证** - 完整的登录注册系统\n- ✅ **文章管理** - 创建、编辑、删除文章\n- ✅ **文件上传** - 支持图片等文件上传\n- ✅ **响应式设计** - 适配各种设备\n\n## 🔒 安全特性\n\n- API速率限制保护\n- JWT身份认证\n- 密码加密存储\n- CSRF防护\n\n## 💡 开始使用\n\n1. 注册新用户或使用默认管理员账户\n2. 创建您的第一篇博客文章\n3. 自定义您的个人资料\n4. 开始分享您的想法！\n\n祝您使用愉快！🎉`,
        excerpt: '欢迎使用基于GitHub数据存储的个人博客系统，这是一个功能完整、安全可靠的博客平台。',
        tags: ['欢迎', '指南', '博客'],
        status: 'published',
        author: 'system',
        authorName: '系统'
      })
      console.log('✅ 欢迎文章创建成功')
    }
    
    console.log('🎉 默认数据初始化完成')
  } catch (error) {
    console.error('❌ 初始化默认数据失败:', error.message)
  }
}

// 运行初始化
const runInitialization = async () => {
  try {
    await initAdminUser()
    await initDefaultData()
  } catch (error) {
    console.error('初始化过程失败:', error)
  }
}

export default runInitialization