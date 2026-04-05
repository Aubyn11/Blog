import express from 'express'
import { getHomeConfig, saveHomeConfig } from '../controllers/homeConfigController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getHomeConfig)              // 获取主页配置（公开）
router.put('/', protect, saveHomeConfig)    // 保存主页配置（需登录）

export default router
