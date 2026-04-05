import express from 'express'
import { getComments, createComment, deleteComment, likeComment } from '../controllers/commentController.js'
import { protect, optionalAuth } from '../middleware/auth.js'

const router = express.Router({ mergeParams: true })

// GET  /api/posts/:postId/comments       — 获取评论列表（公开）
router.get('/', getComments)

// POST /api/posts/:postId/comments       — 发表评论（支持游客）
router.post('/', optionalAuth, createComment)

// DELETE /api/posts/:postId/comments/:commentId — 删除评论（需登录）
router.delete('/:commentId', protect, deleteComment)

// POST /api/posts/:postId/comments/:commentId/like — 点赞评论（公开）
router.post('/:commentId/like', likeComment)

export default router
