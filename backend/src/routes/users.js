import express from 'express'
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// 所有路由都需要认证
router.use(protect)

// 路由定义
router.get('/', authorize('admin'), getUsers)
router.get('/:id', getUser)
router.put('/:id', updateUser)
router.delete('/:id', authorize('admin'), deleteUser)

export default router