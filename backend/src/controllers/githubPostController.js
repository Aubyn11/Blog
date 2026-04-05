import GitHubStorage from '../services/githubStorage.js'

// 懒加载：在第一次使用时才实例化，确保dotenv已加载
let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取所有文章
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tag } = req.query
    
    let posts = await getStorage().getPosts()
    
    // 过滤状态
    if (status) {
      posts = posts.filter(post => post.status === status)
    }
    
    // 过滤标签
    if (tag) {
      posts = posts.filter(post => post.tags && post.tags.includes(tag))
    }
    
    // 排序（最新的在前）
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedPosts = posts.slice(startIndex, endIndex)
    
    res.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(posts.length / limit),
        totalItems: posts.length,
        hasNext: endIndex < posts.length,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('获取文章失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文章失败',
      error: error.message
    })
  }
}

// 根据ID获取文章
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params
    const post = await getStorage().getPostById(id)
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }
    
    // 增加阅读量
    if (req.method === 'GET') {
      post.views = (post.views || 0) + 1
      await getStorage().updatePost(id, { views: post.views })
    }
    
    res.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('获取文章详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文章详情失败',
      error: error.message
    })
  }
}

// 创建文章
export const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, tags, featuredImage, status } = req.body
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      })
    }
    
    const newPost = await getStorage().createPost({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      tags: tags || [],
      featuredImage,
      status: status || 'draft',
      author: req.user?.userId || 'anonymous',
      authorName: req.user?.username || '匿名用户'
    })
    
    res.status(201).json({
      success: true,
      message: '文章创建成功',
      data: newPost
    })
  } catch (error) {
    console.error('创建文章失败:', error)
    res.status(500).json({
      success: false,
      message: '创建文章失败',
      error: error.message
    })
  }
}

// 更新文章
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const existingPost = await getStorage().getPostById(id)
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }
    
    const updatedPost = await getStorage().updatePost(id, updates)
    
    res.json({
      success: true,
      message: '文章更新成功',
      data: updatedPost
    })
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json({
      success: false,
      message: '更新文章失败',
      error: error.message
    })
  }
}

// 删除文章
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    
    const existingPost = await getStorage().getPostById(id)
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }
    
    await getStorage().deletePost(id)
    
    res.json({
      success: true,
      message: '文章删除成功'
    })
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json({
      success: false,
      message: '删除文章失败',
      error: error.message
    })
  }
}

// 点赞文章
export const likePost = async (req, res) => {
  try {
    const { id } = req.params
    
    const post = await getStorage().getPostById(id)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      })
    }
    
    post.likes = (post.likes || 0) + 1
    const updatedPost = await getStorage().updatePost(id, { likes: post.likes })
    
    res.json({
      success: true,
      message: '点赞成功',
      data: { likes: updatedPost.likes }
    })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: error.message
    })
  }
}

// 搜索文章
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      })
    }
    
    let posts = await getStorage().getPosts()
    
    // 简单搜索（标题和内容）
    const searchResults = posts.filter(post => 
      post.title.toLowerCase().includes(q.toLowerCase()) ||
      post.content.toLowerCase().includes(q.toLowerCase())
    )
    
    // 排序
    searchResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedResults = searchResults.slice(startIndex, endIndex)
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(searchResults.length / limit),
        totalItems: searchResults.length,
        hasNext: endIndex < searchResults.length,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('搜索文章失败:', error)
    res.status(500).json({
      success: false,
      message: '搜索文章失败',
      error: error.message
    })
  }
}