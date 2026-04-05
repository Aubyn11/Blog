import { v4 as uuidv4 } from 'uuid'
import GitHubStorage from '../services/githubStorage.js'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// GitHub 存储中评论文件路径
const COMMENTS_FILE = 'data/comments.json'

// 读取所有评论（githubStorage.readFile 已返回解析后的 JSON）
const readComments = async () => {
  try {
    const data = await getStorage().readFile(COMMENTS_FILE)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// 写入所有评论
const writeComments = async (comments) => {
  await getStorage().writeFile(COMMENTS_FILE, comments)
}

// 格式化评论
const formatComment = (c) => ({
  id: c.id,
  postId: c.postId,
  parentId: c.parentId || null,
  content: c.content,
  likes: c.likes || 0,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  author: c.author || null,
  guestName: c.guestName || null,
  authorName: c.author?.username || c.guestName || '匿名用户'
})

// 获取文章评论（树形结构）
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params
    const allComments = await readComments()

    const postComments = allComments.filter(
      c => c.postId === postId && c.status === 'approved'
    )

    const topComments = postComments.filter(c => !c.parentId)
    const replies = postComments.filter(c => !!c.parentId)

    const replyMap = {}
    replies.forEach(r => {
      if (!replyMap[r.parentId]) replyMap[r.parentId] = []
      replyMap[r.parentId].push(formatComment(r))
    })

    const result = topComments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(c => ({
        ...formatComment(c),
        replies: (replyMap[c.id] || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }))

    res.json({ success: true, data: result, total: topComments.length })
  } catch (error) {
    console.error('获取评论失败:', error)
    res.status(500).json({ success: false, message: '获取评论失败', error: error.message })
  }
}

// 发表评论
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params
    const { content, parentId, guestName } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' })
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ success: false, message: '评论内容不能超过1000个字符' })
    }
    if (!req.user && (!guestName || guestName.trim().length === 0)) {
      return res.status(400).json({ success: false, message: '请填写昵称' })
    }

    const allComments = await readComments()

    // 验证父评论存在
    if (parentId) {
      const parent = allComments.find(c => c.id === parentId && c.status === 'approved')
      if (!parent) {
        return res.status(404).json({ success: false, message: '被回复的评论不存在' })
      }
    }

    const now = new Date().toISOString()
    const newComment = {
      id: uuidv4(),
      postId,
      parentId: parentId || null,
      content: content.trim(),
      likes: 0,
      status: 'approved',
      createdAt: now,
      updatedAt: now,
      author: req.user
        ? { id: req.user.userId, username: req.user.username }
        : null,
      guestName: req.user ? null : (guestName?.trim() || '匿名用户')
    }

    allComments.push(newComment)
    await writeComments(allComments)

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: { ...formatComment(newComment), replies: [] }
    })
  } catch (error) {
    console.error('发表评论失败:', error)
    res.status(500).json({ success: false, message: '发表评论失败', error: error.message })
  }
}

// 删除评论
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user?.userId
    const isAdmin = req.user?.role === 'admin'

    const allComments = await readComments()
    const idx = allComments.findIndex(c => c.id === commentId)
    if (idx === -1 || allComments[idx].status === 'deleted') {
      return res.status(404).json({ success: false, message: '评论不存在' })
    }

    const comment = allComments[idx]
    const isOwner = comment.author?.id === userId
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除此评论' })
    }

    // 软删除
    allComments[idx].status = 'deleted'
    // 同时软删除子回复
    allComments.forEach((c, i) => {
      if (c.parentId === commentId) allComments[i].status = 'deleted'
    })

    await writeComments(allComments)
    res.json({ success: true, message: '评论删除成功' })
  } catch (error) {
    console.error('删除评论失败:', error)
    res.status(500).json({ success: false, message: '删除评论失败', error: error.message })
  }
}

// 点赞评论
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const allComments = await readComments()
    const idx = allComments.findIndex(c => c.id === commentId && c.status === 'approved')
    if (idx === -1) {
      return res.status(404).json({ success: false, message: '评论不存在' })
    }
    allComments[idx].likes = (allComments[idx].likes || 0) + 1
    await writeComments(allComments)
    res.json({ success: true, data: { likes: allComments[idx].likes } })
  } catch (error) {
    res.status(500).json({ success: false, message: '点赞失败', error: error.message })
  }
}
