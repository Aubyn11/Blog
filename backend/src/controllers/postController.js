import { validationResult } from 'express-validator'
import Post from '../models/Post.js'

// 获取文章列表
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const tag = req.query.tag || ''
    const status = req.query.status || 'published'

    // 构建查询条件
    const query = { status }
    
    if (search) {
      query.$text = { $search: search }
    }
    
    if (tag) {
      query.tags = tag
    }

    // 如果是普通用户，只返回已发布的文章
    if (req.user?.role !== 'admin') {
      query.status = 'published'
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Post.countDocuments(query)

    res.json({
      success: true,
      data: {
        data: posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取文章列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    })
  }
}

// 获取单篇文章
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar bio')

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章未找到'
      })
    }

    // 检查文章状态
    if (post.status !== 'published' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问此文章'
      })
    }

    // 增加阅读量（非作者本人）
    if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
      post.views += 1
      await post.save()
    }

    res.json({
      success: true,
      data: { post }
    })
  } catch (error) {
    console.error('获取文章错误:', error)
    res.status(500).json({
      success: false,
      message: '获取文章失败'
    })
  }
}

// 创建文章
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const { title, content, excerpt, tags, status = 'draft' } = req.body
    const coverImage = req.file ? req.file.path : undefined

    const post = new Post({
      title,
      content,
      excerpt,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      coverImage,
      status,
      author: req.user._id
    })

    await post.save()
    await post.populate('author', 'username avatar')

    res.status(201).json({
      success: true,
      message: '文章创建成功',
      data: { post }
    })
  } catch (error) {
    console.error('创建文章错误:', error)
    res.status(500).json({
      success: false,
      message: '创建文章失败'
    })
  }
}

// 更新文章
export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章未找到'
      })
    }

    // 检查权限
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权修改此文章'
      })
    }

    const { title, content, excerpt, tags, status } = req.body
    const coverImage = req.file ? req.file.path : undefined

    // 更新字段
    if (title) post.title = title
    if (content) post.content = content
    if (excerpt) post.excerpt = excerpt
    if (tags) post.tags = tags.split(',').map(tag => tag.trim())
    if (status) post.status = status
    if (coverImage) post.coverImage = coverImage

    await post.save()
    await post.populate('author', 'username avatar')

    res.json({
      success: true,
      message: '文章更新成功',
      data: { post }
    })
  } catch (error) {
    console.error('更新文章错误:', error)
    res.status(500).json({
      success: false,
      message: '更新文章失败'
    })
  }
}

// 删除文章
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章未找到'
      })
    }

    // 检查权限
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此文章'
      })
    }

    await Post.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: '文章删除成功'
    })
  } catch (error) {
    console.error('删除文章错误:', error)
    res.status(500).json({
      success: false,
      message: '删除文章失败'
    })
  }
}

// 点赞文章
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章未找到'
      })
    }

    const userId = req.user._id.toString()
    const isLiked = post.likes.includes(userId)

    if (isLiked) {
      // 取消点赞
      post.likes = post.likes.filter(like => like.toString() !== userId)
    } else {
      // 点赞
      post.likes.push(userId)
    }

    await post.save()
    await post.populate('author', 'username avatar')

    res.json({
      success: true,
      message: isLiked ? '取消点赞成功' : '点赞成功',
      data: { post }
    })
  } catch (error) {
    console.error('点赞操作错误:', error)
    res.status(500).json({
      success: false,
      message: '操作失败'
    })
  }
}