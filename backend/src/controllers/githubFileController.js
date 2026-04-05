import GitHubStorage from '../services/githubStorage.js'

let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取文件列表（只返回当前用户的文件）
export const getFiles = async (req, res) => {
  try {
    const userId = req.user.userId
    const files = await getStorage().getFiles(userId)
    res.json({ success: true, data: files })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({ success: false, message: '获取文件列表失败', error: error.message })
  }
}

// 上传文件信息
export const uploadFile = async (req, res) => {
  try {
    const userId = req.user.userId

    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有接收到文件' })
    }

    const { originalname, filename, path, size, mimetype } = req.file

    const newFile = await getStorage().createFile(userId, {
      originalName: originalname,
      fileName: filename,
      filePath: path,
      fileSize: size,
      mimeType: mimetype,
      uploader: userId,
      uploaderName: req.user.username || '匿名用户',
      url: `/uploads/${filename}`,
      isPublic: true
    })

    res.status(201).json({ success: true, message: '文件上传成功', data: newFile })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({ success: false, message: '文件上传失败', error: error.message })
  }
}

// 删除文件（只有文件所有者或管理员可删除）
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'

    const files = await getStorage().getFiles(userId)
    const file = files.find(f => f.id === id)

    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }

    if (file.ownerId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: '没有权限删除此文件' })
    }

    await getStorage().deleteFile(userId, id)
    res.json({ success: true, message: '文件删除成功' })
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({ success: false, message: '删除文件失败', error: error.message })
  }
}

// 获取文件详情
export const getFileById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const files = await getStorage().getFiles(userId)
    const file = files.find(f => f.id === id)

    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' })
    }

    res.json({ success: true, data: file })
  } catch (error) {
    console.error('获取文件详情失败:', error)
    res.status(500).json({ success: false, message: '获取文件详情失败', error: error.message })
  }
}