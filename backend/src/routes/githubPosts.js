import express from 'express'
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  searchPosts
} from '../controllers/githubPostController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 公开路由
router.get('/', getPosts) // 获取所有文章
router.get('/search', searchPosts) // 搜索文章
router.get('/:id', getPostById) // 根据ID获取文章
router.post('/:id/like', likePost) // 点赞文章

// 需要认证的路由
router.post('/', protect, createPost) // 创建文章
router.put('/:id', protect, updatePost) // 更新文章
router.delete('/:id', protect, deletePost) // 删除文章

export default router