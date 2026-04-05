import GitHubStorage from '../services/githubStorage.js'
import bcrypt from 'bcryptjs'

const storage = new GitHubStorage()

// 初始化管理员用户
export const initAdminUser = async () => {
  try {
    console.log('🔧 检查管理员用户初始化...')
    
    const users = await storage.getUsers()
    
    // 检查是否已存在管理员用户
    const adminUser = users.find(user => user.role === 'admin')
    
    if (adminUser) {
      console.log('✅ 管理员用户已存在:', adminUser.username)
      return adminUser
    }
    
    // 创建默认管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const newAdmin = await storage.createUser({
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
    const posts = await storage.getPosts()
    if (posts.length === 0) {
      // 创建欢迎文章
      const welcomePost = await storage.createPost({
        title: '欢迎使用个人博客系统',
        content: `# 欢迎使用个人博客系统

这是一个基于GitHub数据存储的个人博客系统，具有以下特性：

## 🚀 功能特性

- ✅ **完全免费** - 使用GitHub仓库存储数据
- ✅ **用户认证** - 完整的登录注册系统
- ✅ **文章管理** - 创建、编辑、删除文章
- ✅ **文件上传** - 支持图片等文件上传
- ✅ **响应式设计** - 适配各种设备

## 🔒 安全特性

- API速率限制保护
- JWT身份认证
- 密码加密存储
- CSRF防护

## 💡 开始使用

1. 注册新用户或使用默认管理员账户
2. 创建您的第一篇博客文章
3. 自定义您的个人资料
4. 开始分享您的想法！

祝您使用愉快！🎉`,
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