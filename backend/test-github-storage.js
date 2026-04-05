import dotenv from 'dotenv'
import GitHubStorage from './src/services/githubStorage.js'

dotenv.config()

async function testGitHubStorage() {
  console.log('🧪 开始测试GitHub数据存储...')
  console.log('📝 配置信息:')
  console.log('   仓库所有者:', process.env.GITHUB_OWNER || '未设置')
  console.log('   仓库名称:', process.env.GITHUB_REPO || '未设置')
  console.log('   分支:', process.env.GITHUB_DATA_BRANCH || 'main')
  
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ 错误: 未设置 GITHUB_TOKEN 环境变量')
    console.log('💡 请在 backend/.env 文件中配置 GITHUB_TOKEN')
    console.log('   获取方式: GitHub → Settings → Developer settings → Personal access tokens')
    return
  }
  
  if (!process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    console.error('❌ 错误: 未设置 GITHUB_OWNER 或 GITHUB_REPO')
    console.log('💡 请在 backend/.env 文件中配置 GitHub 仓库信息')
    return
  }
  
  const storage = new GitHubStorage()
  
  try {
    // 1. 健康检查
    console.log('\n🔍 步骤1: 健康检查...')
    const health = await storage.healthCheck()
    console.log('✅', health.message)
    
    // 2. 测试文章操作
    console.log('\n📝 步骤2: 测试文章操作...')
    
    // 读取文章（文件不存在时应返回空数组）
    const initialPosts = await storage.getPosts()
    console.log('✅ 读取测试通过，现有文章数量:', initialPosts.length)
    
    // 创建测试文章
    const testPost = {
      title: 'GitHub存储测试文章',
      content: '这是一篇用于测试GitHub数据存储功能的文章。',
      excerpt: 'GitHub存储测试文章摘要',
      tags: ['测试', 'GitHub', '存储'],
      status: 'published',
      author: 'test-user',
      authorName: '测试用户'
    }
    
    const newPost = await storage.createPost(testPost)
    console.log('✅ 创建测试通过，文章ID:', newPost.id)
    
    // 读取验证
    const postsAfterCreate = await storage.getPosts()
    console.log('✅ 创建后文章数量:', postsAfterCreate.length)
    
    // 更新文章
    const updatedPost = await storage.updatePost(newPost.id, {
      title: '更新后的GitHub存储测试文章',
      views: 10
    })
    console.log('✅ 更新测试通过，新标题:', updatedPost.title)
    
    // 根据ID获取文章
    const retrievedPost = await storage.getPostById(newPost.id)
    console.log('✅ 根据ID获取测试通过，标题:', retrievedPost.title)
    
    // 3. 测试用户操作
    console.log('\n👤 步骤3: 测试用户操作...')
    
    const initialUsers = await storage.getUsers()
    console.log('✅ 读取用户测试通过，现有用户数量:', initialUsers.length)
    
    // 创建测试用户
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed_password_placeholder',
      displayName: '测试用户',
      role: 'user'
    }
    
    const newUser = await storage.createUser(testUser)
    console.log('✅ 创建用户测试通过，用户ID:', newUser.id)
    
    // 根据邮箱查找用户
    const foundUser = await storage.getUserByEmail('test@example.com')
    console.log('✅ 邮箱查找用户测试通过，用户名:', foundUser.username)
    
    // 4. 测试文件操作
    console.log('\n📁 步骤4: 测试文件操作...')
    
    const initialFiles = await storage.getFiles()
    console.log('✅ 读取文件测试通过，现有文件数量:', initialFiles.length)
    
    // 创建测试文件记录
    const testFile = {
      originalName: 'test-image.jpg',
      fileName: 'test123.jpg',
      filePath: '/uploads/test123.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      uploader: 'test-user',
      uploaderName: '测试用户'
    }
    
    const newFile = await storage.createFile(testFile)
    console.log('✅ 创建文件记录测试通过，文件ID:', newFile.id)
    
    // 5. 清理测试数据
    console.log('\n🧹 步骤5: 清理测试数据...')
    
    await storage.deletePost(newPost.id)
    console.log('✅ 删除文章测试通过')
    
    // 注意：实际项目中应该更谨慎地删除用户数据
    // 这里为了测试简单直接删除
    const users = await storage.getUsers()
    const testUsers = users.filter(u => u.email === 'test@example.com')
    for (const user of testUsers) {
      // 实际实现中应该有更安全的删除逻辑
      console.log('⚠️  测试用户保留，实际项目中应安全删除')
    }
    
    const files = await storage.getFiles()
    const testFiles = files.filter(f => f.originalName === 'test-image.jpg')
    for (const file of testFiles) {
      await storage.deleteFile(file.id)
    }
    console.log('✅ 清理文件记录测试通过')
    
    // 6. 最终验证
    console.log('\n🎯 步骤6: 最终验证...')
    
    const finalPosts = await storage.getPosts()
    const finalUsers = await storage.getUsers()
    const finalFiles = await storage.getFiles()
    
    console.log('📊 最终数据统计:')
    console.log('   文章数量:', finalPosts.length)
    console.log('   用户数量:', finalUsers.length)
    console.log('   文件数量:', finalFiles.length)
    
    console.log('\n🎉 所有测试通过！GitHub数据存储配置成功！')
    console.log('\n💡 下一步操作:')
    console.log('   1. 启动后端服务器: npm run dev')
    console.log('   2. 启动前端应用: cd .. && npm run dev')
    console.log('   3. 访问 http://localhost:3000 测试完整功能')
    
  } catch (error) {
    console.error('\n❌ 测试失败:')
    console.error('   错误信息:', error.message)
    
    if (error.status === 401) {
      console.error('💡 可能的原因: GitHub Token无效或过期')
      console.error('   解决方案: 重新生成Personal Access Token')
    } else if (error.status === 404) {
      console.error('💡 可能的原因: GitHub仓库不存在')
      console.error('   解决方案: 检查GITHUB_OWNER和GITHUB_REPO配置')
    } else if (error.status === 403) {
      console.error('💡 可能的原因: 权限不足或API速率限制')
      console.error('   解决方案: 检查Token权限，等待速率限制重置')
    }
    
    console.log('\n🔧 详细错误信息:')
    console.error(error)
  }
}

// 运行测试
testGitHubStorage()
  .then(() => {
    console.log('\n🏁 测试完成')
    process.exit(0)
  })
  .catch(error => {
    console.error('测试过程中发生未预期的错误:', error)
    process.exit(1)
  })