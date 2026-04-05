import express from 'express'
import Post from '../models/Post.js'

const router = express.Router()

// 转义 XML 特殊字符
const escapeXml = (str = '') =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// GET /api/rss  —— 生成 RSS 2.0 Feed
router.get('/', async (req, res) => {
  try {
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)

    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)

    const lastBuildDate = posts.length > 0
      ? new Date(posts[0].createdAt).toUTCString()
      : new Date().toUTCString()

    const items = posts.map(post => {
      const link = `${siteUrl}/blog/${post._id}`
      const pubDate = new Date(post.createdAt).toUTCString()
      const description = escapeXml(post.excerpt || post.content?.slice(0, 200) || '')
      const categories = (post.tags || [])
        .map(tag => `<category>${escapeXml(tag)}</category>`)
        .join('\n        ')

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <author>${escapeXml(post.author?.username || '未知作者')}</author>
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
    res.set('Cache-Control', 'public, max-age=3600') // 缓存1小时
    res.send(xml)
  } catch (error) {
    console.error('RSS生成失败:', error)
    res.status(500).json({ error: 'RSS生成失败' })
  }
})

export default router
