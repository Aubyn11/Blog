import GitHubStorage from '../services/githubStorage.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 生成JWT令牌（包含 role 字段，用于权限校验）
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// 用户注册
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: '用户名、邮箱和密码不能为空' })
    }

    // 检查邮箱是否已注册
    const existingByEmail = await getStorage().getUserByEmail(email)
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: '邮箱已被注册' })
    }

    // 检查用户名是否已被使用
    const existingByUsername = await getStorage().getUserByUsername(username)
    if (existingByUsername) {
      return res.status(400).json({ success: false, message: '用户名已被使用' })
    }

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

    const token = generateToken(newUser)
    const { password: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: { user: userWithoutPassword, token }
    })
  } catch (error) {
    console.error('用户注册失败:', error)
    res.status(500).json({ success: false, message: '注册失败', error: error.message })
  }
}

// 用户登录
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和密码不能为空' })
    }

    const user = await getStorage().getUserByEmail(email)
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' })
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: '账户已被禁用，请联系管理员' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' })
    }

    const token = generateToken(user)
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: '登录成功',
      data: { user: userWithoutPassword, token }
    })
  } catch (error) {
    console.error('用户登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败', error: error.message })
  }
}

// 获取当前用户信息
export const getCurrentUser = async (req, res) => {
  try {
    const user = await getStorage().getUserById(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    const { password, ...userWithoutPassword } = user
    res.json({ success: true, data: userWithoutPassword })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败', error: error.message })
  }
}

// 获取指定用户的公开信息（用于查看他人主页）
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await getStorage().getUserById(userId)
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    // 只返回公开字段
    const { password, email, isActive, ...publicProfile } = user
    res.json({ success: true, data: publicProfile })
  } catch (error) {
    console.error('获取用户主页失败:', error)
    res.status(500).json({ success: false, message: '获取用户主页失败', error: error.message })
  }
}

// 更新用户信息（只能更新自己）
export const updateUser = async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body
    const updates = {}
    if (displayName) updates.displayName = displayName
    if (bio !== undefined) updates.bio = bio
    if (avatar) updates.avatar = avatar

    const updatedUser = await getStorage().updateUser(req.user.userId, updates)
    const { password, ...userWithoutPassword } = updatedUser

    res.json({ success: true, message: '用户信息更新成功', data: userWithoutPassword })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({ success: false, message: '更新用户信息失败', error: error.message })
  }
}

// 修改密码
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '当前密码和新密码不能为空' })
    }

    const user = await getStorage().getUserById(req.user.userId)
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: '当前密码错误' })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12)
    await getStorage().updateUser(req.user.userId, { password: hashedNewPassword })

    res.json({ success: true, message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ success: false, message: '修改密码失败', error: error.message })
  }
}

// ─── 管理员功能 ──────────────────────────────────────────────

// 获取所有用户（仅管理员）
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' })
    }
    const users = await getStorage().getUsers()
    const usersWithoutPassword = users.map(({ password, ...user }) => user)
    res.json({ success: true, data: usersWithoutPassword })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message })
  }
}

// 禁用/启用用户（仅管理员）
export const toggleUserStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' })
    }

    const { userId } = req.params
    if (userId === req.user.userId) {
      return res.status(400).json({ success: false, message: '不能禁用自己的账户' })
    }

    const user = await getStorage().getUserById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const updatedUser = await getStorage().updateUser(userId, { isActive: !user.isActive })
    const { password, ...userWithoutPassword } = updatedUser

    res.json({
      success: true,
      message: `用户已${updatedUser.isActive ? '启用' : '禁用'}`,
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('修改用户状态失败:', error)
    res.status(500).json({ success: false, message: '修改用户状态失败', error: error.message })
  }
}

// 修改用户角色（仅管理员）
export const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' })
    }

    const { userId } = req.params
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: '角色值无效，只能是 user 或 admin' })
    }

    if (userId === req.user.userId) {
      return res.status(400).json({ success: false, message: '不能修改自己的角色' })
    }

    const user = await getStorage().getUserById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    const updatedUser = await getStorage().updateUser(userId, { role })
    const { password, ...userWithoutPassword } = updatedUser

    res.json({ success: true, message: '用户角色已更新', data: userWithoutPassword })
  } catch (error) {
    console.error('修改用户角色失败:', error)
    res.status(500).json({ success: false, message: '修改用户角色失败', error: error.message })
  }
}