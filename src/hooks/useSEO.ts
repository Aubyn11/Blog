import { useEffect } from 'react'

interface SEOOptions {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  author?: string
  publishedAt?: string
}

const SITE_NAME = '个人博客'
const DEFAULT_DESCRIPTION = '分享技术、生活与思考的个人博客'

export const useSEO = (options: SEOOptions = {}) => {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image,
    url = window.location.href,
    type = 'website',
    author,
    publishedAt,
  } = options

  useEffect(() => {
    // 设置 title
    const fullTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle

    // 辅助函数：设置或创建 meta 标签
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // 基础 meta
    setMeta('description', description)

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', url, true)
    setMeta('og:type', type, true)
    setMeta('og:site_name', SITE_NAME, true)
    if (image) setMeta('og:image', image, true)

    // Twitter Card
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    if (image) setMeta('twitter:image', image)

    // 文章专属
    if (type === 'article') {
      if (author) setMeta('article:author', author, true)
      if (publishedAt) setMeta('article:published_time', publishedAt, true)
    }

    // 规范链接
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    // 组件卸载时恢复默认 title
    return () => {
      document.title = SITE_NAME
    }
  }, [title, description, image, url, type, author, publishedAt])
}

export default useSEO
