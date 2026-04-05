import { Octokit } from "octokit"

class GitHubStorage {
  constructor() {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GitHub token not configured. Please set GITHUB_TOKEN in .env file')
    }
    
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })
    
    this.owner = process.env.GITHUB_OWNER
    this.repo = process.env.GITHUB_REPO
    this.branch = process.env.GITHUB_DATA_BRANCH || 'main'
    
    // 请求队列用于处理速率限制
    this.requestQueue = []
    this.isProcessing = false
    this.lastRequestTime = 0
  }

  // 节流请求处理GitHub API速率限制
  async throttledRequest(method, path, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ method, path, options, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return
    
    this.isProcessing = true
    const request = this.requestQueue.shift()
    
    try {
      // 确保每秒不超过1个请求（GitHub API限制）
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      if (timeSinceLastRequest < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest))
      }
      
      const response = await this.octokit.request(`${request.method} ${request.path}`, request.options)
      this.lastRequestTime = Date.now()
      request.resolve(response)
    } catch (error) {
      request.reject(error)
    }
    
    this.isProcessing = false
    this.processQueue()
  }

  // 读取JSON文件
  async readFile(filePath) {
    try {
      const response = await this.throttledRequest('GET', '/repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: this.branch
      })
      
      // Base64解码
      const content = Buffer.from(response.data.content, 'base64').toString('utf8')
      return JSON.parse(content)
    } catch (error) {
      if (error.status === 404) {
        // 文件不存在，返回空数据
        console.log(`📄 文件 ${filePath} 不存在，创建空数据`)
        return []
      }
      console.error('❌ 读取文件失败:', error.message)
      throw error
    }
  }

  // 写入JSON文件
  async writeFile(filePath, data) {
    try {
      // 先获取当前文件的SHA（用于更新）
      let sha = null
      try {
        const currentFile = await this.throttledRequest('GET', '/repos/{owner}/{repo}/contents/{path}', {
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: this.branch
        })
        sha = currentFile.data.sha
      } catch (error) {
        // 文件不存在，SHA为null
        sha = null
      }

      const content = JSON.stringify(data, null, 2)
      const contentBase64 = Buffer.from(content).toString('base64')

      const response = await this.throttledRequest('PUT', '/repos/{owner}/{repo}/contents/{path}', {
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `Update ${filePath} at ${new Date().toISOString()}`,
        content: contentBase64,
        sha: sha,
        branch: this.branch
      })

      console.log(`✅ 文件 ${filePath} 更新成功`)
      return response.data
    } catch (error) {
      console.error('❌ 写入文件失败:', error.message)
      throw error
    }
  }

  // 博客文章相关操作
  async getPosts() {
    return await this.readFile(process.env.GITHUB_POSTS_FILE || 'data/posts.json')
  }

  async getPostById(id) {
    const posts = await this.getPosts()
    return posts.find(p => p.id === id)
  }

  async createPost(post) {
    const posts = await this.getPosts()
    const newPost = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...post,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0
    }
    posts.push(newPost)
    await this.writeFile(process.env.GITHUB_POSTS_FILE || 'data/posts.json', posts)
    return newPost
  }

  async updatePost(id, updates) {
    const posts = await this.getPosts()
    const index = posts.findIndex(p => p.id === id)
    if (index === -1) throw new Error('文章不存在')
    
    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await this.writeFile(process.env.GITHUB_POSTS_FILE || 'data/posts.json', posts)
    return posts[index]
  }

  async deletePost(id) {
    const posts = await this.getPosts()
    const filteredPosts = posts.filter(p => p.id !== id)
    await this.writeFile(process.env.GITHUB_POSTS_FILE || 'data/posts.json', filteredPosts)
  }

  // 用户相关操作
  async getUsers() {
    return await this.readFile(process.env.GITHUB_USERS_FILE || 'data/users.json')
  }

  async getUserById(id) {
    const users = await this.getUsers()
    return users.find(u => u.id === id)
  }

  async getUserByEmail(email) {
    const users = await this.getUsers()
    return users.find(u => u.email === email)
  }

  async createUser(user) {
    const users = await this.getUsers()
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    users.push(newUser)
    await this.writeFile(process.env.GITHUB_USERS_FILE || 'data/users.json', users)
    return newUser
  }

  async updateUser(id, updates) {
    const users = await this.getUsers()
    const index = users.findIndex(u => u.id === id)
    if (index === -1) throw new Error('用户不存在')
    
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await this.writeFile(process.env.GITHUB_USERS_FILE || 'data/users.json', users)
    return users[index]
  }

  // 文件相关操作
  async getFiles() {
    return await this.readFile(process.env.GITHUB_FILES_FILE || 'data/files.json')
  }

  async createFile(file) {
    const files = await this.getFiles()
    const newFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...file,
      createdAt: new Date().toISOString()
    }
    files.push(newFile)
    await this.writeFile(process.env.GITHUB_FILES_FILE || 'data/files.json', files)
    return newFile
  }

  async deleteFile(id) {
    const files = await this.getFiles()
    const filteredFiles = files.filter(f => f.id !== id)
    await this.writeFile(process.env.GITHUB_FILES_FILE || 'data/files.json', filteredFiles)
  }

  // 页面相关操作
  async getPages() {
    return await this.readFile(process.env.GITHUB_PAGES_FILE || 'data/pages.json')
  }

  async getPageById(id) {
    const pages = await this.getPages()
    return pages.find(p => p.id === id)
  }

  async createPage(page) {
    const pages = await this.getPages()
    const newPage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...page,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    pages.push(newPage)
    await this.writeFile(process.env.GITHUB_PAGES_FILE || 'data/pages.json', pages)
    return newPage
  }

  async updatePage(id, updates) {
    const pages = await this.getPages()
    const index = pages.findIndex(p => p.id === id)
    if (index === -1) throw new Error('页面不存在')
    pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString() }
    await this.writeFile(process.env.GITHUB_PAGES_FILE || 'data/pages.json', pages)
    return pages[index]
  }

  async deletePage(id) {
    const pages = await this.getPages()
    const filtered = pages.filter(p => p.id !== id)
    await this.writeFile(process.env.GITHUB_PAGES_FILE || 'data/pages.json', filtered)
  }

  // 主页配置相关操作
  async getHomeConfig() {
    try {
      const config = await this.readFile(process.env.GITHUB_HOME_CONFIG_FILE || 'data/home-config.json')
      // readFile 在文件不存在时返回 []，这里需要返回对象
      if (Array.isArray(config)) return null
      return config
    } catch (error) {
      return null
    }
  }

  async saveHomeConfig(config) {
    await this.writeFile(process.env.GITHUB_HOME_CONFIG_FILE || 'data/home-config.json', config)
    return config
  }

  // 健康检查
  async healthCheck() {
    try {
      // 测试仓库访问
      await this.throttledRequest('GET', '/repos/{owner}/{repo}', {
        owner: this.owner,
        repo: this.repo
      })
      return { status: 'healthy', message: 'GitHub存储服务运行正常' }
    } catch (error) {
      return { status: 'unhealthy', message: `GitHub存储服务异常: ${error.message}` }
    }
  }
}

export default GitHubStorage