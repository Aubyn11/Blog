import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// 用户注册
export const register = async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const { username, email, password } = req.body

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      })
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    })

    await user.save()

    // 生成令牌
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    })
  }
}

// 用户登录
export const login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    // 查找用户
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      })
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }

    // 生成令牌
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    })
  }
}

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')

    res.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
}

// 用户登出
export const logout = async (req, res) => {
  try {
    // 在实际应用中，你可能需要将令牌加入黑名单
    // 这里我们只是返回成功消息，由客户端删除令牌
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error('登出错误:', error)
    res.status(500).json({
      success: false,
      message: '登出失败'
    })
  }
}

// 更新用户信息
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const { username, bio } = req.body
    const avatar = req.file ? req.file.path : undefined

    // 检查用户名是否已被其他用户使用
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        })
      }
    }

    const updateData = {}
    if (username) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    if (avatar) updateData.avatar = avatar

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: { user }
    })
  } catch (error) {
    console.error('更新个人信息错误:', error)
    res.status(500).json({
      success: false,
      message: '更新失败，请稍后重试'
    })
  }
}