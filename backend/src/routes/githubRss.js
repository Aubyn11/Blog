import express from 'express'

const router = express.Router()

// 转义 XML 特殊字符
const escapeXml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// GET /api/github/rss  —— GitHub 存储模式的 RSS Feed
router.get('/', async (req, res) => {
  try {
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)

    // 动态导入 GitHub 存储控制器
    const { getAllPosts } = await import('../controllers/githubPostController.js')

    // 模拟 req/res 获取文章列表
    let posts = []
    await new Promise((resolve) => {
      const fakeReq = { query: { page: '1', limit: String(limit), status: 'published' } }
      const fakeRes = {
        json: (data) => {
          posts = data?.data || data?.posts || []
          resolve()
        },
        status: () => ({ json: () => resolve() })
      }
      getAllPosts(fakeReq, fakeRes).catch(() => resolve())
    })

    const lastBuildDate = posts.length > 0
      ? new Date(posts[0].createdAt || posts[0].created_at).toUTCString()
      : new Date().toUTCString()

    const items = posts.slice(0, limit).map(post => {
      const id = post._id || post.id
      const link = `${siteUrl}/blog/${id}`
      const pubDate = new Date(post.createdAt || post.created_at).toUTCString()
      const description = escapeXml(post.excerpt || post.content?.slice(0, 200) || '')
      const authorName = post.author?.username || post.authorName || '未知作者'
      const categories = (post.tags || [])
        .map(tag => `<category>${escapeXml(tag)}</category>`)
        .join('\n        ')

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <author>${escapeXml(authorName)}</author>
      <pubDate>${pubDate}</pubDate>
      ${categories}
    </item>`
    }).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>个人博客</title>
    <link>${siteUrl}</link>
    <description>分享技术、生活与思考的个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
    ${items}
  </channel>
</rss>`

    res.set('Content-Type', 'application/rss+xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch (error) {
    console.error('GitHub RSS生成失败:', error)
    res.status(500).json({ error: 'RSS生成失败' })
  }
})

export default router
