import GitHubStorage from '../services/githubStorage.js'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取文章列表
// 支持 ?userId=xxx 查看指定用户的文章，不传则返回全站文章
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tag, userId: queryUserId } = req.query

    let posts
    if (queryUserId) {
      // 查看指定用户的文章
      posts = await getStorage().getPosts(queryUserId)
    } else {
      // 全站文章（聚合所有用户）
      posts = await getStorage().getAllPosts()
    }

    // 未登录或非管理员只能看已发布的文章
    const isAdmin = req.user?.role === 'admin'
    const isSelf = queryUserId && req.user?.userId === queryUserId
    if (!isAdmin && !isSelf) {
      posts = posts.filter(post => post.status === 'published')
    } else if (status) {
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
    res.status(500).json({ success: false, message: '获取文章失败', error: error.message })
  }
}

// 根据ID获取文章
// 需要在 URL 中携带 ?userId=xxx 或文章本身记录了 authorId
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params
    // 先尝试从 query 获取 userId，否则遍历所有用户查找
    let post = null
    const queryUserId = req.query.userId
    if (queryUserId) {
      post = await getStorage().getPostById(queryUserId, id)
    } else {
      // 全站查找
      const allPosts = await getStorage().getAllPosts()
      post = allPosts.find(p => p.id === id)
    }

    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }

    // 非作者/非管理员不能查看草稿
    const isAdmin = req.user?.role === 'admin'
    const isSelf = req.user?.userId === post.authorId
    if (post.status !== 'published' && !isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: '无权查看此文章' })
    }

    // 增加阅读量
    await getStorage().updatePost(post.authorId, id, { views: (post.views || 0) + 1 })

    res.json({ success: true, data: { ...post, views: (post.views || 0) + 1 } })
  } catch (error) {
    console.error('获取文章详情失败:', error)
    res.status(500).json({ success: false, message: '获取文章详情失败', error: error.message })
  }
}

// 创建文章（需要登录）
export const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, tags, featuredImage, status } = req.body
    const userId = req.user.userId

    if (!title || !content) {
      return res.status(400).json({ success: false, message: '标题和内容不能为空' })
    }

    const newPost = await getStorage().createPost(userId, {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      tags: tags || [],
      featuredImage,
      status: status || 'draft',
      author: userId,
      authorName: req.user.username || '匿名用户'
    })

    res.status(201).json({ success: true, message: '文章创建成功', data: newPost })
  } catch (error) {
    console.error('创建文章失败:', error)
    res.status(500).json({ success: false, message: '创建文章失败', error: error.message })
  }
}

// 更新文章（只有作者或管理员可操作）
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'

    // 先找到文章确认归属
    const allPosts = await getStorage().getAllPosts()
    const existingPost = allPosts.find(p => p.id === id)
    if (!existingPost) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }

    if (existingPost.authorId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权修改此文章' })
    }

    const updatedPost = await getStorage().updatePost(existingPost.authorId, id, req.body)
    res.json({ success: true, message: '文章更新成功', data: updatedPost })
  } catch (error) {
    console.error('更新文章失败:', error)
    res.status(500).json({ success: false, message: '更新文章失败', error: error.message })
  }
}

// 删除文章（只有作者或管理员可操作）
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'

    const allPosts = await getStorage().getAllPosts()
    const existingPost = allPosts.find(p => p.id === id)
    if (!existingPost) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }

    if (existingPost.authorId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除此文章' })
    }

    await getStorage().deletePost(existingPost.authorId, id)
    res.json({ success: true, message: '文章删除成功' })
  } catch (error) {
    console.error('删除文章失败:', error)
    res.status(500).json({ success: false, message: '删除文章失败', error: error.message })
  }
}

// 点赞文章
export const likePost = async (req, res) => {
  try {
    const { id } = req.params

    const allPosts = await getStorage().getAllPosts()
    const post = allPosts.find(p => p.id === id)
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }

    const updatedPost = await getStorage().updatePost(post.authorId, id, {
      likes: (post.likes || 0) + 1
    })

    res.json({ success: true, message: '点赞成功', data: { likes: updatedPost.likes } })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ success: false, message: '点赞失败', error: error.message })
  }
}

// 搜索文章（全站搜索）
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query

    if (!q) {
      return res.status(400).json({ success: false, message: '搜索关键词不能为空' })
    }

    let posts = await getStorage().getAllPosts()

    // 只搜索已发布的文章（全站搜索）
    posts = posts.filter(post => post.status === 'published')

    const searchResults = posts.filter(post =>
      post.title.toLowerCase().includes(q.toLowerCase()) ||
      post.content.toLowerCase().includes(q.toLowerCase())
    )

    searchResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

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
    res.status(500).json({ success: false, message: '搜索文章失败', error: error.message })
  }
}