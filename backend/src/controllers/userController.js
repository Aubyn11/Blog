import { validationResult } from 'express-validator'
import User from '../models/User.js'

// 获取用户列表（仅管理员）
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const search = req.query.search || ''

    const query = {}
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      data: {
        data: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    })
  }
}

// 获取单个用户信息
export const getUser = async (req, res) => {
  try {
    const userId = req.params.id
    
    // 普通用户只能查看自己的信息，管理员可以查看所有用户信息
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此用户信息'
      })
    }

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      })
    }

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

// 更新用户信息
export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入数据无效',
        errors: errors.array()
      })
    }

    const userId = req.params.id
    
    // 普通用户只能更新自己的信息
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权更新此用户信息'
      })
    }

    const { username, bio, role, isActive } = req.body
    const updateData = {}

    // 普通用户不能修改角色和激活状态
    if (req.user.role === 'admin') {
      if (role !== undefined) updateData.role = role
      if (isActive !== undefined) updateData.isActive = isActive
    }

    if (username) updateData.username = username
    if (bio !== undefined) updateData.bio = bio

    // 检查用户名是否已被其他用户使用
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        })
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      })
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user }
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    })
  }
}

// 删除用户（仅管理员）
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id

    // 不能删除自己
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      })
    }

    await User.findByIdAndDelete(userId)

    res.json({
      success: true,
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('删除用户错误:', error)
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    })
  }
}