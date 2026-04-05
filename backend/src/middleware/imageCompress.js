import path from 'path'
import fs from 'fs'

// 动态加载 sharp（原生模块，部分部署环境可能不支持）
let sharpLib = null
const loadSharp = async () => {
  if (sharpLib) return sharpLib
  try {
    const mod = await import('sharp')
    sharpLib = mod.default
    return sharpLib
  } catch {
    console.warn('⚠️ sharp 模块不可用，图片压缩已禁用（上传功能不受影响）')
    return null
  }
}

/**
 * 图片压缩中间件
 * - 自动将 JPEG/PNG/GIF 转换为 WebP 格式
 * - 限制最大宽度为 1920px，超出则等比缩放
 * - 压缩质量 80%
 * - 原文件替换为压缩后的 WebP 文件
 */
export const compressImage = async (req, res, next) => {
  if (!req.file) return next()

  const { mimetype, path: filePath, filename } = req.file
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!imageTypes.includes(mimetype)) return next()

  const sharp = await loadSharp()
  if (!sharp) return next() // sharp 不可用时跳过压缩

  try {
    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const outputPath = path.join(path.dirname(filePath), `${baseName}.webp`)

    await sharp(filePath)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath)

    if (filePath !== outputPath) {
      fs.unlink(filePath, () => {})
    }

    req.file.path = outputPath
    req.file.filename = `${baseName}.webp`
    req.file.mimetype = 'image/webp'

    const stat = fs.statSync(outputPath)
    req.file.size = stat.size

    next()
  } catch (err) {
    console.error('图片压缩失败，使用原文件:', err.message)
    next()
  }
}

/**
 * 批量图片压缩（多文件上传）
 */
export const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next()

  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const sharp = await loadSharp()
  if (!sharp) return next() // sharp 不可用时跳过压缩

  await Promise.all(
    req.files.map(async (file) => {
      if (!imageTypes.includes(file.mimetype)) return

      try {
        const ext = path.extname(file.filename)
        const baseName = path.basename(file.filename, ext)
        const outputPath = path.join(path.dirname(file.path), `${baseName}.webp`)

        await sharp(file.path)
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath)

        if (file.path !== outputPath) {
          fs.unlink(file.path, () => {})
        }

        file.path = outputPath
        file.filename = `${baseName}.webp`
        file.mimetype = 'image/webp'
        const stat = fs.statSync(outputPath)
        file.size = stat.size
      } catch (err) {
        console.error(`图片压缩失败 [${file.filename}]:`, err.message)
      }
    })
  )

  next()
}
