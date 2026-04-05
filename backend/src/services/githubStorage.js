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

  // ─── 路径辅助 ───────────────────────────────────────────────
  // 用户隔离路径：data/users/{userId}/xxx.json
  userScopedPath(userId, filename) {
    if (!userId) throw new Error('userId 不能为空')
    return `data/users/${userId}/${filename}`
  }

  // ─── 读写基础方法 ────────────────────────────────────────────
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

  // ─── 博客文章（按用户隔离）──────────────────────────────────
  _postsPath(userId) {
    return this.userScopedPath(userId, 'posts.json')
  }

  async getPosts(userId) {
    return await this.readFile(this._postsPath(userId))
  }

  async getPostById(userId, id) {
    const posts = await this.getPosts(userId)
    return posts.find(p => p.id === id)
  }

  async createPost(userId, post) {
    const posts = await this.getPosts(userId)
    const newPost = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...post,
      authorId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0
    }
    posts.push(newPost)
    await this.writeFile(this._postsPath(userId), posts)
    return newPost
  }

  async updatePost(userId, id, updates) {
    const posts = await this.getPosts(userId)
    const index = posts.findIndex(p => p.id === id)
    if (index === -1) throw new Error('文章不存在')
    
    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await this.writeFile(this._postsPath(userId), posts)
    return posts[index]
  }

  async deletePost(userId, id) {
    const posts = await this.getPosts(userId)
    const filteredPosts = posts.filter(p => p.id !== id)
    await this.writeFile(this._postsPath(userId), filteredPosts)
  }

  // 获取所有用户的文章（用于全站首页/搜索）
  async getAllPosts() {
    const users = await this.getUsers()
    const allPosts = []
    for (const user of users) {
      try {
        const posts = await this.getPosts(user.id)
        allPosts.push(...posts)
      } catch (e) {
        // 该用户暂无文章，跳过
      }
    }
    return allPosts
  }

  // ─── 用户（全局共用）────────────────────────────────────────
  _usersPath() {
    return process.env.GITHUB_USERS_FILE || 'data/users.json'
  }

  async getUsers() {
    return await this.readFile(this._usersPath())
  }

  async getUserById(id) {
    const users = await this.getUsers()
    return users.find(u => u.id === id)
  }

  async getUserByEmail(email) {
    const users = await this.getUsers()
    return users.find(u => u.email === email)
  }

  async getUserByUsername(username) {
    const users = await this.getUsers()
    return users.find(u => u.username === username)
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
    await this.writeFile(this._usersPath(), users)
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
    
    await this.writeFile(this._usersPath(), users)
    return users[index]
  }

  // ─── 文件（按用户隔离）──────────────────────────────────────
  _filesPath(userId) {
    return this.userScopedPath(userId, 'files.json')
  }

  async getFiles(userId) {
    return await this.readFile(this._filesPath(userId))
  }

  async createFile(userId, file) {
    const files = await this.getFiles(userId)
    const newFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...file,
      ownerId: userId,
      createdAt: new Date().toISOString()
    }
    files.push(newFile)
    await this.writeFile(this._filesPath(userId), files)
    return newFile
  }

  async deleteFile(userId, id) {
    const files = await this.getFiles(userId)
    const filteredFiles = files.filter(f => f.id !== id)
    await this.writeFile(this._filesPath(userId), filteredFiles)
  }

  // ─── 页面（按用户隔离）──────────────────────────────────────
  _pagesPath(userId) {
    return this.userScopedPath(userId, 'pages.json')
  }

  async getPages(userId) {
    return await this.readFile(this._pagesPath(userId))
  }

  async getPageById(userId, id) {
    const pages = await this.getPages(userId)
    return pages.find(p => p.id === id)
  }

  async createPage(userId, page) {
    const pages = await this.getPages(userId)
    const newPage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...page,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    pages.push(newPage)
    await this.writeFile(this._pagesPath(userId), pages)
    return newPage
  }

  async updatePage(userId, id, updates) {
    const pages = await this.getPages(userId)
    const index = pages.findIndex(p => p.id === id)
    if (index === -1) throw new Error('页面不存在')
    pages[index] = { ...pages[index], ...updates, updatedAt: new Date().toISOString() }
    await this.writeFile(this._pagesPath(userId), pages)
    return pages[index]
  }

  async deletePage(userId, id) {
    const pages = await this.getPages(userId)
    const filtered = pages.filter(p => p.id !== id)
    await this.writeFile(this._pagesPath(userId), filtered)
  }

  // ─── 主页配置（按用户隔离）──────────────────────────────────
  _homeConfigPath(userId) {
    return this.userScopedPath(userId, 'home-config.json')
  }

  async getHomeConfig(userId) {
    try {
      const config = await this.readFile(this._homeConfigPath(userId))
      if (Array.isArray(config)) return null
      return config
    } catch (error) {
      return null
    }
  }

  async saveHomeConfig(userId, config) {
    await this.writeFile(this._homeConfigPath(userId), config)
    return config
  }

  // ─── 健康检查 ────────────────────────────────────────────────
  async healthCheck() {
    try {
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