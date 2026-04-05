import express from 'express'
import {
  register,
  login,
  getCurrentUser,
  updateUser,
  changePassword,
  getUsers
} from '../controllers/githubUserController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 公开路由
router.post('/register', register) // 用户注册
router.post('/login', login) // 用户登录

// 需要认证的路由
router.get('/me', protect, getCurrentUser) // 获取当前用户信息
router.put('/me', protect, updateUser) // 更新用户信息
router.put('/me/password', protect, changePassword) // 修改密码

// 管理员路由
router.get('/', protect, getUsers) // 获取所有用户（管理员）

export default router