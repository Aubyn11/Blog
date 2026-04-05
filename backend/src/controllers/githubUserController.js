import GitHubStorage from '../services/githubStorage.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 懒加载：在第一次使用时才实例化，确保dotenv已加载
let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 用户注册
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码不能为空'
      })
    }
    
    // 检查用户是否已存在
    const existingUser = await getStorage().getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      })
    }
    
    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const newUser = await getStorage().createUser({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username,
      role: 'user',
      avatar: null,
      bio: '',
      isActive: true
    })
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    
    // 移除密码字段
    const { password: _, ...userWithoutPassword } = newUser
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('用户注册失败:', error)
    res.status(500).json({
      success: false,
      message: '注册失败',
      error: error.message
    })
  }
}

// 用户登录
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱和密码不能为空'
      })
    }
    
    // 查找用户
    const user = await getStorage().getUserByEmail(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }
    
    // 检查用户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      })
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      })
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    
    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('用户登录失败:', error)
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    })
  }
}

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const user = await getStorage().getUserById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 移除密码字段
    const { password, ...userWithoutPassword } = user
    
    res.json({
      success: true,
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    })
  }
}

// 更新用户信息
export const updateUser = async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body
    
    const updates = {}
    if (displayName) updates.displayName = displayName
    if (bio !== undefined) updates.bio = bio
    if (avatar) updates.avatar = avatar
    
    const updatedUser = await getStorage().updateUser(req.user.userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
    
    // 移除密码字段
    const { password, ...userWithoutPassword } = updatedUser
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    })
  }
}

// 修改密码
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码不能为空'
      })
    }
    
    const user = await getStorage().getUserById(req.user.userId)
    
    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      })
    }
    
    // 哈希新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    
    await getStorage().updateUser(req.user.userId, {
      password: hashedNewPassword,
      updatedAt: new Date().toISOString()
    })
    
    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    })
  }
}

// 获取所有用户（管理员功能）
export const getUsers = async (req, res) => {
  try {
    // 检查权限
    const currentUser = await getStorage().getUserById(req.user.userId)
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      })
    }
    
    const users = await getStorage().getUsers()
    
    // 移除密码字段
    const usersWithoutPassword = users.map(({ password, ...user }) => user)
    
    res.json({
      success: true,
      data: usersWithoutPassword
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    })
  }
}
