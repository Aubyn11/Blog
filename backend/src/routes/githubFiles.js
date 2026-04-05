import express from 'express'
import {
  getFiles,
  uploadFile,
  deleteFile,
  getFileById
} from '../controllers/githubFileController.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

// 公开路由
router.get('/', getFiles) // 获取文件列表
router.get('/:id', getFileById) // 获取文件详情

// 需要认证的路由
router.post('/upload', protect, upload.single('file'), uploadFile) // 上传文件
router.delete('/:id', protect, deleteFile) // 删除文件

export default router