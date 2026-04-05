import express from 'express'
import {
  exportMarkdown, exportJSON,
  importMarkdown, importJSON, importUpload
} from '../controllers/importExportController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// 导出（需要登录）
router.get('/export/markdown', protect, exportMarkdown)
router.get('/export/json', protect, exportJSON)

// 导入（需要登录）
router.post('/import/markdown', protect, importUpload.single('file'), importMarkdown)
router.post('/import/json', protect, importUpload.single('file'), importJSON)

export default router
