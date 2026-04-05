import GitHubStorage from '../services/githubStorage.js'

// 懒加载：在第一次使用时才实例化，确保dotenv已加载
let _storage = null
const getStorage = () => {
  if (!_storage) _storage = new GitHubStorage()
  return _storage
}

// 获取文件列表
export const getFiles = async (req, res) => {
  try {
    const files = await getStorage().getFiles()
    
    res.json({
      success: true,
      data: files
    })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: error.message
    })
  }
}

// 上传文件信息（实际文件上传需要另外处理）
export const uploadFile = async (req, res) => {
  try {
    const { originalname, filename, path, size, mimetype } = req.file || {}
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      })
    }
    
    const newFile = await getStorage().createFile({
      originalName: originalname,
      fileName: filename,
      filePath: path,
      fileSize: size,
      mimeType: mimetype,
      uploader: req.user?.userId || 'anonymous',
      uploaderName: req.user?.username || '匿名用户',
      url: `/uploads/${filename}`,
      isPublic: true
    })
    
    res.status(201).json({
      success: true,
      message: '文件上传成功',
      data: newFile
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    })
  }
}

// 删除文件
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params
    
    const files = await getStorage().getFiles()
    const file = files.find(f => f.id === id)
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      })
    }
    
    // 检查权限（只有上传者或管理员可以删除）
    if (file.uploader !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此文件'
      })
    }
    
    await getStorage().deleteFile(id)
    
    res.json({
      success: true,
      message: '文件删除成功'
    })
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    })
  }
}

// 获取文件详情
export const getFileById = async (req, res) => {
  try {
    const { id } = req.params
    
    const files = await getStorage().getFiles()
    const file = files.find(f => f.id === id)
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      })
    }
    
    res.json({
      success: true,
      data: file
    })
  } catch (error) {
    console.error('获取文件详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取文件详情失败',
      error: error.message
    })
  }
}