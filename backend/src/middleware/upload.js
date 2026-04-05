import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 文件类型检查
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  }

  const allAllowedTypes = [
    ...allowedTypes.image,
    ...allowedTypes.video,
    ...allowedTypes.audio,
    ...allowedTypes.document
  ]

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'), false)
  }
}

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// 文件大小限制
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5 // 最多5个文件
}

// 创建上传实例
export const upload = multer({
  storage,
  fileFilter,
  limits
})

// 错误处理中间件
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      })
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超过限制（最多5个）'
      })
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '不支持的文件字段'
      })
    }
  }
  
  if (err.message === '不支持的文件类型') {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
  
  next(err)
}