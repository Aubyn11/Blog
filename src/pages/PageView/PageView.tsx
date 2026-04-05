import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, Video as VideoIcon, FileText } from 'lucide-react'
import { Page, PageComponent, PageBackground } from '../../types'
import { pageService } from '../../services/api'

// ==================== 背景层 ====================
const BackgroundLayer: React.FC<{ background: PageBackground }> = ({ background: bg }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: bg.width || '100%',
    height: bg.height || '100%',
    opacity: bg.opacity ?? 1,
    zIndex: 0,
    pointerEvents: 'none',
  }
  if (bg.type === 'color') {
    style.backgroundColor = bg.color || '#ffffff'
  } else if (bg.type === 'image') {
    const src = bg.imageLocalData || bg.imageUrl
    if (src) {
      style.backgroundImage = `url(${src})`
      style.backgroundSize = bg.size || 'cover'
      style.backgroundPosition = bg.position || 'center'
      style.backgroundRepeat = bg.repeat || 'no-repeat'
    }
  } else if (bg.type === 'gradient') {
    style.backgroundImage = bg.gradient || ''
  }
  return <div style={style} />
}

// ==================== 渲染单个组件 ====================
const RenderComponent: React.FC<{ comp: PageComponent }> = ({ comp }) => {
  const p = comp.props
  const imgSrc = p.localData || p.src

  // 组件外层尺寸样式
  const wrapStyle: React.CSSProperties = {}
  if (p.width && p.width !== 'auto') wrapStyle.width = p.width
  if (p.height && p.height !== 'auto') { wrapStyle.height = p.height; wrapStyle.overflow = 'hidden' }

  const inner = (() => {
    switch (comp.type) {
      case 'heading': {
        const Tag = `h${p.level || 2}` as keyof JSX.IntrinsicElements
        const sizeMap: Record<number, string> = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-2xl', 4: 'text-xl', 5: 'text-lg', 6: 'text-base' }
        return <Tag style={{ color: p.color, textAlign: p.align }} className={`font-bold ${sizeMap[p.level] || 'text-3xl'} mb-4`}>{p.text}</Tag>
      }
      case 'text':
        return <p style={{ color: p.color, textAlign: p.align, fontSize: p.fontSize }} className="leading-relaxed mb-4">{p.text}</p>
      case 'image':
        return (
          <figure style={{ textAlign: p.align }} className="mb-4">
            {imgSrc
              ? <img src={imgSrc} alt={p.alt} style={{ width: '100%', height: p.height && p.height !== 'auto' ? '100%' : undefined, objectFit: 'cover', maxWidth: '100%' }} className="rounded-lg inline-block" />
              : <div className="bg-gray-100 rounded-lg flex items-center justify-center h-40 text-gray-400"><ImageIcon className="w-10 h-10" /></div>
            }
            {p.caption && <figcaption className="text-sm text-gray-500 mt-2 text-center">{p.caption}</figcaption>}
          </figure>
        )
      case 'button': {
        const variantClass = p.variant === 'primary'
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : p.variant === 'outline'
          ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        return (
          <div style={{ textAlign: p.align }} className="mb-4">
            <a href={p.href || '#'} className={`inline-block px-6 py-2.5 rounded-lg font-medium transition-colors ${variantClass}`}>{p.text}</a>
          </div>
        )
      }
      case 'divider':
        return <hr style={{ borderColor: p.color, marginTop: p.margin, marginBottom: p.margin, borderStyle: p.style }} />
      case 'card':
        return (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-4 hover:shadow-md transition-shadow h-full">
            {(p.imageLocalData || p.image) && <img src={p.imageLocalData || p.image} alt={p.title} className="w-full h-48 object-cover" />}
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{p.title}</h3>
              <p className="text-gray-600">{p.content}</p>
              {p.link && <a href={p.link} className="inline-block mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">了解更多 →</a>}
            </div>
          </div>
        )
      case 'columns':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: p.gap }} className="mb-4">
            {(p.items || []).map((item: string, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 text-gray-700">{item}</div>
            ))}
          </div>
        )
      case 'video':
        return (
          <div className="mb-4">
            {p.src
              ? <video src={p.src} poster={p.poster} controls style={{ width: '100%', height: '100%' }} className="rounded-lg" />
              : <div className="bg-gray-100 rounded-lg flex items-center justify-center h-40 text-gray-400"><VideoIcon className="w-10 h-10" /></div>
            }
          </div>
        )
      case 'code':
        return (
          <pre className="bg-gray-900 text-green-400 rounded-xl p-5 overflow-x-auto text-sm mb-4 h-full">
            <code>{p.code}</code>
          </pre>
        )
      case 'quote':
        return (
          <blockquote style={{ borderLeftColor: p.color }} className="border-l-4 pl-5 py-2 mb-4 bg-gray-50 rounded-r-lg">
            <p className="text-gray-700 italic text-lg">{p.text}</p>
            {p.author && <cite className="text-sm text-gray-500 not-italic mt-2 block">— {p.author}</cite>}
          </blockquote>
        )
      case 'list':
        return p.ordered
          ? <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">{(p.items || []).map((item: string, i: number) => <li key={i}>{item}</li>)}</ol>
          : <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">{(p.items || []).map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
      case 'page-card': {
        if (!p.pageSlug) return (
          <div className="border border-dashed border-gray-300 rounded-xl p-5 mb-4 text-center text-gray-400 text-sm">
            <FileText className="w-6 h-6 mx-auto mb-1 opacity-40" />
            未关联页面
          </div>
        )
        const isHorizontal = (p.layout || 'horizontal') === 'horizontal'
        return (
          <Link
            to={`/page/${p.pageSlug}`}
            className={`group flex mb-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all ${
              isHorizontal ? 'flex-row items-center gap-4 p-5' : 'flex-col p-5'
            }`}
          >
            <div className={`bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isHorizontal ? 'w-12 h-12' : 'w-10 h-10 mb-3'
            }`}>
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base group-hover:text-indigo-700 transition-colors">
                {p.pageTitle}
              </h3>
              {p.showDescription !== false && p.pageDescription && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.pageDescription}</p>
              )}
            </div>
            <span className="text-sm text-indigo-500 flex-shrink-0 group-hover:translate-x-1 transition-transform">
              {isHorizontal ? '→' : '查看详情 →'}
            </span>
          </Link>
        )
      }
      default:
        return null
    }
  })()

  if (!inner) return null
  // 如果有自定义尺寸，包裹一层
  if (wrapStyle.width || wrapStyle.height) {
    return <div style={wrapStyle}>{inner}</div>
  }
  return <>{inner}</>
}

// ==================== 页面展示 ====================
const PageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    pageService.getPageBySlug(slug)
      .then(setPage)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (notFound || !page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-500 mb-6">页面不存在或已被删除</p>
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
          <ArrowLeft className="w-4 h-4" />返回首页
        </Link>
      </div>
    )
  }

  const bg = page.background

  return (
    <div className="relative min-h-screen">
      {/* 背景层（最底层） */}
      {bg && <BackgroundLayer background={bg} />}

      {/* 内容层 */}
      <div className="relative max-w-3xl mx-auto px-4 py-10" style={{ zIndex: 1 }}>
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{page.title}</h1>
          {page.description && <p className="text-gray-500 text-lg">{page.description}</p>}
        </div>

        {/* 页面内容 */}
        <div>
          {page.components.map(comp => (
            <RenderComponent key={comp.id} comp={comp} />
          ))}
        </div>

        {/* 底部返回 */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
            <ArrowLeft className="w-4 h-4" />返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PageView
