import GitHubStorage from '../services/githubStorage.js'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取主页配置（公开接口，需要 ?userId=xxx 查看指定用户的主页）
export const getHomeConfig = async (req, res) => {
  try {
    const queryUserId = req.query.userId || req.user?.userId
    if (!queryUserId) {
      return res.status(400).json({ success: false, message: '需要提供 userId 参数' })
    }
    const config = await getStorage().getHomeConfig(queryUserId)
    res.json({ success: true, data: config })
  } catch (error) {
    console.error('获取主页配置失败:', error)
    res.status(500).json({ success: false, message: '获取主页配置失败', error: error.message })
  }
}

// 保存主页配置（需要登录，只能保存自己的配置）
export const saveHomeConfig = async (req, res) => {
  try {
    const userId = req.user.userId
    const config = req.body
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ success: false, message: '配置数据无效' })
    }
    const saved = await getStorage().saveHomeConfig(userId, {
      ...config,
      updatedAt: new Date().toISOString()
    })
    res.json({ success: true, message: '主页配置保存成功', data: saved })
  } catch (error) {
    console.error('保存主页配置失败:', error)
    res.status(500).json({ success: false, message: '保存主页配置失败', error: error.message })
  }
}
