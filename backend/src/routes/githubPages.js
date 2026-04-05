import express from 'express'
import { getPages, getPageById, getPageBySlug, createPage, updatePage, deletePage } from '../controllers/githubPageController.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'

const router = express.Router()

router.get('/', optionalAuth, getPages)           // 获取所有页面（管理端）
router.get('/slug/:slug', getPageBySlug)          // 按 slug 获取（公开）
router.get('/:id', optionalAuth, getPageById)     // 按 ID 获取
router.post('/', authenticate, createPage)        // 创建页面（需登录）
router.put('/:id', authenticate, updatePage)      // 更新页面（需登录）
router.delete('/:id', authenticate, deletePage)   // 删除页面（需登录）

export default router
