import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  createUploadTicket,
  isConfigured,
  validateRequest,
  limits,
  allowedTypes,
} from '../services/r2Storage.js'

const router = express.Router()

/**
 * GET /api/uploads/config
 * 前端用它判断要不要显示「上传」按钮。
 * 不返回任何密钥，只返回是否可用。
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: isConfigured(),
      limits,
      allowedTypes,
    },
  })
})

/**
 * POST /api/uploads/presign
 * body: { kind: 'video' | 'image', filename: string, contentType: string, size: number }
 * 返回短时效的直传地址，浏览器拿到后直接 PUT 到 R2。
 */
router.post('/presign', protect, async (req, res, next) => {
  try {
    const { kind = 'video', filename, contentType, size } = req.body || {}

    const check = validateRequest({ kind, contentType, size })
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message })
    }

    const ticket = await createUploadTicket({ kind, filename, contentType })

    res.json({
      success: true,
      data: {
        ...ticket,
        // 把要求的 Content-Type 回传，前端 PUT 时必须原样带上
        contentType,
      },
    })
  } catch (err) {
    if (err.statusCode === 503) {
      return res.status(503).json({ success: false, message: err.message })
    }
    next(err)
  }
})

export default router
