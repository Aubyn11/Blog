import express from 'express'
import { body } from 'express-validator'
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost
} from '../controllers/postController.js'
import { protect, optionalAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// 验证规则
const createPostValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200个字符之间'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('内容至少10个字符'),
  body('excerpt')
    .isLength({ min: 10, max: 300 })
    .withMessage('摘要长度必须在10-300个字符之间'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('状态必须是 published 或 draft')
]

const updatePostValidation = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200个字符之间'),
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('内容至少10个字符'),
  body('excerpt')
    .optional()
    .isLength({ min: 10, max: 300 })
    .withMessage('摘要长度必须在10-300个字符之间'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('状态必须是 published 或 draft')
]

// 路由定义
router.get('/', optionalAuth, getPosts)
router.get('/:id', optionalAuth, getPost)
router.post('/', protect, upload.single('coverImage'), createPostValidation, createPost)
router.put('/:id', protect, upload.single('coverImage'), updatePostValidation, updatePost)
router.delete('/:id', protect, deletePost)
router.post('/:id/like', protect, likePost)

export default router