import express from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  getCurrentUser,
  logout,
  updateProfile
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// 验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少6个字符')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字')
]

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
]

const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('个人简介不能超过500个字符')
]

// 路由定义
router.post('/register', registerValidation, register)
router.post('/login', loginValidation, login)
router.get('/me', protect, getCurrentUser)
router.post('/logout', protect, logout)
router.put('/profile', protect, upload.single('avatar'), updateProfileValidation, updateProfile)

export default router