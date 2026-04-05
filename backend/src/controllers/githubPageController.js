import GitHubStorage from '../services/githubStorage.js'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取所有页面
export const getPages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    let pages = await getStorage().getPages()

    if (status) {
      pages = pages.filter(p => p.status === status)
    }

    pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const startIndex = (page - 1) * limit
    const paginatedPages = pages.slice(startIndex, startIndex + Number(limit))

    res.json({
      success: true,
      data: paginatedPages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(pages.length / limit),
        totalItems: pages.length,
        hasNext: startIndex + Number(limit) < pages.length,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('获取页面列表失败:', error)
    res.status(500).json({ success: false, message: '获取页面列表失败', error: error.message })
  }
}

// 根据ID获取页面
export const getPageById = async (req, res) => {
  try {
    const { id } = req.params
    const page = await getStorage().getPageById(id)
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' })
    }
    res.json({ success: true, data: page })
  } catch (error) {
    console.error('获取页面详情失败:', error)
    res.status(500).json({ success: false, message: '获取页面详情失败', error: error.message })
  }
}

// 根据 slug 获取页面（公开访问）
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params
    const pages = await getStorage().getPages()
    const page = pages.find(p => p.slug === slug && p.status === 'published')
    if (!page) {
      return res.status(404).json({ success: false, message: '页面不存在' })
    }
    res.json({ success: true, data: page })
  } catch (error) {
    console.error('获取页面失败:', error)
    res.status(500).json({ success: false, message: '获取页面失败', error: error.message })
  }
}

// 创建页面
export const createPage = async (req, res) => {
  try {
    const { title, slug, description, components, status } = req.body

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: '标题和路径标识不能为空' })
    }

    // 检查 slug 是否重复
    const pages = await getStorage().getPages()
    if (pages.find(p => p.slug === slug)) {
      return res.status(400).json({ success: false, message: '路径标识已存在，请换一个' })
    }

    const newPage = await getStorage().createPage({
      title,
      slug,
      description: description || '',
      components: components || [],
      status: status || 'draft',
      author: req.user?.userId || 'anonymous',
      authorName: req.user?.username || '匿名用户'
    })

    res.status(201).json({ success: true, message: '页面创建成功', data: newPage })
  } catch (error) {
    console.error('创建页面失败:', error)
    res.status(500).json({ success: false, message: '创建页面失败', error: error.message })
  }
}

// 更新页面
export const updatePage = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const existing = await getStorage().getPageById(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '页面不存在' })
    }

    // 如果修改了 slug，检查是否重复
    if (updates.slug && updates.slug !== existing.slug) {
      const pages = await getStorage().getPages()
      if (pages.find(p => p.slug === updates.slug && p.id !== id)) {
        return res.status(400).json({ success: false, message: '路径标识已存在，请换一个' })
      }
    }

    const updatedPage = await getStorage().updatePage(id, updates)
    res.json({ success: true, message: '页面更新成功', data: updatedPage })
  } catch (error) {
    console.error('更新页面失败:', error)
    res.status(500).json({ success: false, message: '更新页面失败', error: error.message })
  }
}

// 删除页面
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params
    const existing = await getStorage().getPageById(id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '页面不存在' })
    }
    await getStorage().deletePage(id)
    res.json({ success: true, message: '页面删除成功' })
  } catch (error) {
    console.error('删除页面失败:', error)
    res.status(500).json({ success: false, message: '删除页面失败', error: error.message })
  }
}
