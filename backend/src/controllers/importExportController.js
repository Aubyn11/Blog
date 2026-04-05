import Post from '../models/Post.js'
import archiver from 'archiver'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ==================== 导出 ====================

/**
 * 导出所有文章为 Markdown ZIP 包
 * GET /api/export/markdown
 */
export const exportMarkdown = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .sort({ createdAt: -1 })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="blog-export-${Date.now()}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    for (const post of posts) {
      const date = new Date(post.createdAt).toISOString().split('T')[0]
      const safeTitle = post.title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 60)
      const filename = `${date}-${safeTitle}.md`

      // 生成 Front Matter + 内容
      const frontMatter = [
        '---',
        `title: "${post.title.replace(/"/g, '\\"')}"`,
        `date: ${post.createdAt}`,
        `author: ${post.author?.username || '未知'}`,
        `tags: [${(post.tags || []).map(t => `"${t}"`).join(', ')}]`,
        `excerpt: "${(post.excerpt || '').replace(/"/g, '\\"')}"`,
        post.coverImage ? `coverImage: "${post.coverImage}"` : null,
        '---',
        '',
      ].filter(l => l !== null).join('\n')

      const content = frontMatter + (post.content || '')
      archive.append(content, { name: filename })
    }

    // 生成导出摘要
    const summary = `# 博客导出摘要\n\n导出时间：${new Date().toLocaleString('zh-CN')}\n文章总数：${posts.length}\n\n## 文章列表\n\n${posts.map((p, i) => `${i + 1}. ${p.title} (${new Date(p.createdAt).toLocaleDateString('zh-CN')})`).join('\n')}\n`
    archive.append(summary, { name: 'README.md' })

    await archive.finalize()
  } catch (error) {
    console.error('导出Markdown失败:', error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: '导出失败' })
    }
  }
}

/**
 * 导出文章为 JSON 格式
 * GET /api/export/json
 */
export const exportJSON = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .sort({ createdAt: -1 })

    const data = {
      exportedAt: new Date().toISOString(),
      total: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        content: p.content,
        excerpt: p.excerpt,
        tags: p.tags,
        author: p.author?.username,
        status: p.status,
        views: p.views,
        coverImage: p.coverImage,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="blog-export-${Date.now()}.json"`)
    res.json(data)
  } catch (error) {
    console.error('导出JSON失败:', error)
    res.status(500).json({ success: false, message: '导出失败' })
  }
}

// ==================== 导入 ====================

// 临时上传目录
const uploadDir = path.join(__dirname, '../../uploads/import-tmp')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `import-${Date.now()}-${file.originalname}`)
})
export const importUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.md', '.markdown', '.json']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('仅支持 .md / .markdown / .json 文件'))
  }
})

/**
 * 解析 Markdown Front Matter
 */
const parseFrontMatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const meta = {}
  match[1].split('\n').forEach(line => {
    const [key, ...vals] = line.split(':')
    if (key && vals.length) {
      let val = vals.join(':').trim()
      // 去除引号
      val = val.replace(/^["']|["']$/g, '')
      // 解析数组 [a, b]
      if (val.startsWith('[') && val.endsWith(']')) {
        meta[key.trim()] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      } else {
        meta[key.trim()] = val
      }
    }
  })
  return { meta, body: match[2].trim() }
}

/**
 * 导入 Markdown 文件
 * POST /api/import/markdown
 */
export const importMarkdown = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' })

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8')
    const { meta, body } = parseFrontMatter(content)

    const title = meta.title || path.basename(req.file.originalname, path.extname(req.file.originalname))
    const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : [])
    const excerpt = meta.excerpt || body.replace(/[#*`\[\]]/g, '').slice(0, 150)

    const post = new Post({
      title,
      content: body,
      excerpt,
      tags,
      coverImage: meta.coverImage || null,
      status: 'draft', // 导入的文章默认为草稿
      author: req.user._id,
    })

    await post.save()
    fs.unlink(req.file.path, () => {})

    res.status(201).json({
      success: true,
      message: `文章《${title}》导入成功（已保存为草稿）`,
      data: { postId: post._id, title }
    })
  } catch (error) {
    fs.unlink(req.file?.path, () => {})
    console.error('导入Markdown失败:', error)
    res.status(500).json({ success: false, message: '导入失败: ' + error.message })
  }
}

/**
 * 导入 JSON 文件（批量）
 * POST /api/import/json
 */
export const importJSON = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: '请上传文件' })

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8')
    const data = JSON.parse(content)
    const posts = data.posts || (Array.isArray(data) ? data : [data])

    const results = []
    for (const p of posts) {
      try {
        const post = new Post({
          title: p.title || '未命名文章',
          content: p.content || '',
          excerpt: p.excerpt || (p.content || '').slice(0, 150),
          tags: p.tags || [],
          coverImage: p.coverImage || null,
          status: 'draft',
          author: req.user._id,
        })
        await post.save()
        results.push({ title: post.title, id: post._id, success: true })
      } catch (e) {
        results.push({ title: p.title, success: false, error: e.message })
      }
    }

    fs.unlink(req.file.path, () => {})
    const succeeded = results.filter(r => r.success).length
    res.status(201).json({
      success: true,
      message: `批量导入完成：成功 ${succeeded} 篇，失败 ${results.length - succeeded} 篇`,
      data: { results }
    })
  } catch (error) {
    fs.unlink(req.file?.path, () => {})
    console.error('导入JSON失败:', error)
    res.status(500).json({ success: false, message: '导入失败: ' + error.message })
  }
}
