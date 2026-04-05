import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import { sendNewCommentNotification, sendReplyNotification } from '../services/emailService.js'

// 获取文章的评论列表（树形结构）
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params

    // 获取所有已审核的顶级评论
    const topComments = await Comment.find({
      postId,
      parentId: null,
      status: 'approved'
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean()

    // 获取所有回复
    const replies = await Comment.find({
      postId,
      parentId: { $ne: null },
      status: 'approved'
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean()

    // 将回复挂载到对应的顶级评论下
    const replyMap = {}
    replies.forEach(reply => {
      const pid = reply.parentId.toString()
      if (!replyMap[pid]) replyMap[pid] = []
      replyMap[pid].push(formatComment(reply))
    })

    const result = topComments.map(c => ({
      ...formatComment(c),
      replies: replyMap[c._id.toString()] || []
    }))

    res.json({
      success: true,
      data: result,
      total: topComments.length
    })
  } catch (error) {
    console.error('获取评论失败:', error)
    res.status(500).json({ success: false, message: '获取评论失败', error: error.message })
  }
}

// 格式化评论数据
const formatComment = (c) => ({
  id: c._id.toString(),
  postId: c.postId.toString(),
  parentId: c.parentId ? c.parentId.toString() : null,
  content: c.content,
  likes: c.likes || 0,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  author: c.author
    ? { id: c.author._id?.toString() || c.author.toString(), username: c.author.username, avatar: c.author.avatar }
    : null,
  guestName: c.guestName || null,
  authorName: c.author?.username || c.guestName || '匿名用户'
})

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

    // 验证文章存在
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }

    // 如果是回复，验证父评论存在
    if (parentId) {
      const parent = await Comment.findById(parentId)
      if (!parent || parent.status !== 'approved') {
        return res.status(404).json({ success: false, message: '被回复的评论不存在' })
      }
    }

    // 游客评论需要提供昵称
    if (!req.user && (!guestName || guestName.trim().length === 0)) {
      return res.status(400).json({ success: false, message: '请填写昵称' })
    }

    const comment = await Comment.create({
      postId,
      parentId: parentId || null,
      author: req.user?.userId || null,
      guestName: req.user ? null : (guestName?.trim() || '匿名用户'),
      content: content.trim(),
      status: 'approved'
    })

    const populated = await Comment.findById(comment._id)
      .populate('author', 'username avatar')
      .lean()

    // 发送邮件通知（异步，不阻塞响应）
    try {
      const commentAuthorName = req.user?.username || guestName?.trim() || '匿名用户'
      if (!parentId) {
        // 新评论：通知文章作者
        const postAuthor = await User.findById(post.author).select('email username')
        if (postAuthor && postAuthor.email) {
          sendNewCommentNotification({
            postTitle: post.title,
            postId: postId,
            commentAuthor: commentAuthorName,
            commentContent: content.trim().slice(0, 200),
            authorEmail: postAuthor.email
          }).catch(() => {})
        }
      } else {
        // 回复：通知被回复的评论者（如果是注册用户）
        const parentComment = await Comment.findById(parentId).populate('author', 'email username')
        if (parentComment?.author?.email) {
          sendReplyNotification({
            postTitle: post.title,
            postId: postId,
            replyAuthor: commentAuthorName,
            replyContent: content.trim().slice(0, 200),
            recipientEmail: parentComment.author.email,
            recipientName: parentComment.author.username
          }).catch(() => {})
        }
      }
    } catch (emailErr) {
      // 邮件通知失败不影响评论发表
      console.warn('邮件通知发送失败:', emailErr.message)
    }

    res.status(201).json({
      success: true,
      message: '评论发表成功',
      data: { ...formatComment(populated), replies: [] }
    })
  } catch (error) {
    console.error('发表评论失败:', error)
    res.status(500).json({ success: false, message: '发表评论失败', error: error.message })
  }
}

// 删除评论（作者本人或管理员）
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user?.userId
    const isAdmin = req.user?.role === 'admin'

    const comment = await Comment.findById(commentId)
    if (!comment || comment.status === 'deleted') {
      return res.status(404).json({ success: false, message: '评论不存在' })
    }

    const isOwner = comment.author && comment.author.toString() === userId
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: '无权删除此评论' })
    }

    // 软删除：将状态改为 deleted
    comment.status = 'deleted'
    await comment.save()

    // 同时软删除所有子回复
    await Comment.updateMany(
      { parentId: commentId, status: 'approved' },
      { status: 'deleted' }
    )

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
    const comment = await Comment.findById(commentId)
    if (!comment || comment.status !== 'approved') {
      return res.status(404).json({ success: false, message: '评论不存在' })
    }
    comment.likes = (comment.likes || 0) + 1
    await comment.save()
    res.json({ success: true, data: { likes: comment.likes } })
  } catch (error) {
    res.status(500).json({ success: false, message: '点赞失败', error: error.message })
  }
}
