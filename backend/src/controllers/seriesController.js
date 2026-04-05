import Series from '../models/Series.js'
import Post from '../models/Post.js'

// 获取系列列表
export const getSeries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status

    const query = {}
    if (status) query.status = status
    else if (req.user?.role !== 'admin') query.status = 'published'

    const series = await Series.find(query)
      .populate('author', 'username avatar')
      .populate({ path: 'posts.post', select: 'title excerpt status createdAt' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Series.countDocuments(query)

    res.json({
      success: true,
      data: { data: series, total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('获取系列列表错误:', error)
    res.status(500).json({ success: false, message: '获取系列列表失败' })
  }
}

// 获取单个系列
export const getSeriesById = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate({ path: 'posts.post', select: 'title excerpt status createdAt views' })

    if (!series) return res.status(404).json({ success: false, message: '系列未找到' })
    if (series.status !== 'published' && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权访问此系列' })
    }

    res.json({ success: true, data: { series } })
  } catch (error) {
    console.error('获取系列错误:', error)
    res.status(500).json({ success: false, message: '获取系列失败' })
  }
}

// 创建系列
export const createSeries = async (req, res) => {
  try {
    const { title, description, coverImage, tags, status } = req.body
    const series = new Series({
      title, description, coverImage, tags, status,
      author: req.user._id,
      posts: []
    })
    await series.save()
    await series.populate('author', 'username avatar')
    res.status(201).json({ success: true, message: '系列创建成功', data: { series } })
  } catch (error) {
    console.error('创建系列错误:', error)
    res.status(500).json({ success: false, message: '创建系列失败' })
  }
}

// 更新系列
export const updateSeries = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
    if (!series) return res.status(404).json({ success: false, message: '系列未找到' })
    if (series.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权修改此系列' })
    }

    const { title, description, coverImage, tags, status, posts } = req.body
    if (title) series.title = title
    if (description !== undefined) series.description = description
    if (coverImage !== undefined) series.coverImage = coverImage
    if (tags) series.tags = tags
    if (status) series.status = status
    if (posts) series.posts = posts  // 允许直接更新排序后的文章列表

    await series.save()
    await series.populate('author', 'username avatar')
    await series.populate({ path: 'posts.post', select: 'title excerpt status createdAt' })
    res.json({ success: true, message: '系列更新成功', data: { series } })
  } catch (error) {
    console.error('更新系列错误:', error)
    res.status(500).json({ success: false, message: '更新系列失败' })
  }
}

// 删除系列
export const deleteSeries = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
    if (!series) return res.status(404).json({ success: false, message: '系列未找到' })
    if (series.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权删除此系列' })
    }
    await Series.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: '系列删除成功' })
  } catch (error) {
    console.error('删除系列错误:', error)
    res.status(500).json({ success: false, message: '删除系列失败' })
  }
}

// 向系列添加文章
export const addPostToSeries = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
    if (!series) return res.status(404).json({ success: false, message: '系列未找到' })
    if (series.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权修改此系列' })
    }

    const { postId } = req.body
    const post = await Post.findById(postId)
    if (!post) return res.status(404).json({ success: false, message: '文章未找到' })

    // 检查是否已存在
    const exists = series.posts.some(p => p.post.toString() === postId)
    if (exists) return res.status(400).json({ success: false, message: '文章已在系列中' })

    series.posts.push({ post: postId, order: series.posts.length })
    await series.save()
    await series.populate({ path: 'posts.post', select: 'title excerpt status createdAt' })
    res.json({ success: true, message: '文章已添加到系列', data: { series } })
  } catch (error) {
    console.error('添加文章到系列错误:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
}

// 从系列移除文章
export const removePostFromSeries = async (req, res) => {
  try {
    const series = await Series.findById(req.params.id)
    if (!series) return res.status(404).json({ success: false, message: '系列未找到' })
    if (series.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权修改此系列' })
    }

    series.posts = series.posts.filter(p => p.post.toString() !== req.params.postId)
    await series.save()
    res.json({ success: true, message: '文章已从系列移除' })
  } catch (error) {
    console.error('移除文章错误:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
}
