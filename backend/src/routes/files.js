import express from 'express'
import { body } from 'express-validator'
import {
  uploadFile,
  getFiles,
  deleteFile,
  getFile
} from '../controllers/fileController.js'
import { protect } from '../middleware/auth.js'
import { upload, handleUploadError } from '../middleware/upload.js'

const router = express.Router()

// 验证规则
const uploadValidation = [
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('文件描述不能超过500个字符')
]

// 路由定义
router.post('/upload', protect, upload.single('file'), uploadValidation, uploadFile)
router.get('/', protect, getFiles)
router.get('/:id', protect, getFile)
router.delete('/:id', protect, deleteFile)

// 文件上传错误处理
router.use(handleUploadError)

export default router