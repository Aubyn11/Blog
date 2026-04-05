import React, { useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Type, Image, Square, Minus, Columns, Video, Code, Quote, List, Layout,
  Plus, Trash2, ChevronUp, ChevronDown, Save, Eye, ArrowLeft,
  Settings, GripVertical, AlignLeft, AlignCenter, AlignRight,
  Layers, Upload, X, FileText
} from 'lucide-react'
import { PageComponent, ComponentType, CreatePageData, PageBackground, Page } from '../../types'
import { pageService } from '../../services/api'
import toast from 'react-hot-toast'

// ==================== 组件配置 ====================
const COMPONENT_CATALOG: { type: ComponentType; label: string; icon: React.FC<any>; defaultProps: Record<string, any> }[] = [
  { type: 'heading',  label: '标题',    icon: Type,    defaultProps: { text: '这是一个标题', level: 2, align: 'left', color: '#111827', width: '100%', height: 'auto' } },
  { type: 'text',     label: '文本段落', icon: AlignLeft, defaultProps: { text: '在这里输入文本内容...', align: 'left', color: '#374151', fontSize: 16, width: '100%', height: 'auto' } },
  { type: 'image',    label: '图片',    icon: Image,   defaultProps: { src: '', localData: '', alt: '图片', width: '100%', height: 'auto', align: 'center', caption: '' } },
  { type: 'button',   label: '按钮',    icon: Square,  defaultProps: { text: '点击按钮', href: '#', variant: 'primary', align: 'left', width: 'auto', height: 'auto' } },
  { type: 'divider',  label: '分割线',  icon: Minus,   defaultProps: { style: 'solid', color: '#e5e7eb', margin: 24, width: '100%', height: 'auto' } },
  { type: 'card',     label: '卡片',    icon: Square,  defaultProps: { title: '卡片标题', content: '卡片内容描述', image: '', link: '', width: '100%', height: 'auto' } },
  { type: 'columns',  label: '多列布局', icon: Columns, defaultProps: { columns: 2, gap: 16, items: ['左侧内容', '右侧内容'], width: '100%', height: 'auto' } },
  { type: 'video',    label: '视频',    icon: Video,   defaultProps: { src: '', poster: '', width: '100%', height: 'auto' } },
  { type: 'code',     label: '代码块',  icon: Code,    defaultProps: { code: '// 在这里输入代码', language: 'javascript', width: '100%', height: 'auto' } },
  { type: 'quote',    label: '引用',    icon: Quote,   defaultProps: { text: '引用内容', author: '', color: '#6366f1', width: '100%', height: 'auto' } },
  { type: 'list',     label: '列表',    icon: List,    defaultProps: { items: ['列表项 1', '列表项 2', '列表项 3'], ordered: false, width: '100%', height: 'auto' } },
  { type: 'page-card', label: '页面卡片', icon: Layout,  defaultProps: { pageId: '', pageSlug: '', pageTitle: '', pageDescription: '', showDescription: true, layout: 'horizontal', width: '100%', height: 'auto' } },
]

// ==================== 图片上传按钮 ====================
const ImageUploadField: React.FC<{
  label: string
  urlKey: string
  localKey: string
  props: Record<string, any>
  onChange: (props: Record<string, any>) => void
}> = ({ label, urlKey, localKey, props: p, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const inputClass = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      onChange({ ...p, [localKey]: ev.target?.result as string, [urlKey]: '' })
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => onChange({ ...p, [localKey]: '', [urlKey]: '' })
  const currentSrc = p[localKey] || p[urlKey]

  return (
    <div className="mb-3">
      <label className={labelClass}>{label}</label>
      {currentSrc ? (
        <div className="relative">
          <img src={currentSrc} alt="预览" className="w-full h-24 object-cover rounded border border-gray-200" />
          <button onClick={clearImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <input type="text" className={inputClass} value={p[urlKey] ?? ''} onChange={e => onChange({ ...p, [urlKey]: e.target.value, [localKey]: '' })} placeholder="输入图片URL" />
          <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            <Upload className="w-3 h-3" />上传本地图片
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}
    </div>
  )
}

// ==================== 尺寸编辑字段 ====================
const SizeFields: React.FC<{ props: Record<string, any>; onChange: (props: Record<string, any>) => void }> = ({ props: p, onChange }) => {
  const inputClass = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"
  return (
    <div className="mb-3 pt-2 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">尺寸</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>宽度</label>
          <input className={inputClass} value={p.width ?? '100%'} onChange={e => onChange({ ...p, width: e.target.value })} placeholder="100% / 300px" />
        </div>
        <div>
          <label className={labelClass}>高度</label>
          <input className={inputClass} value={p.height ?? 'auto'} onChange={e => onChange({ ...p, height: e.target.value })} placeholder="auto / 200px" />
        </div>
      </div>
    </div>
  )
}

// ==================== 组件渲染（预览用）====================
const ComponentPreview: React.FC<{ comp: PageComponent; selected: boolean; onClick: () => void }> = ({ comp, selected, onClick }) => {
  const p = comp.props
  const baseClass = `relative group cursor-pointer rounded transition-all ${selected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:ring-1 hover:ring-indigo-300'}`
  const wrapStyle: React.CSSProperties = {
    width: p.width && p.width !== 'auto' ? p.width : undefined,
    height: p.height && p.height !== 'auto' ? p.height : undefined,
    overflow: p.height && p.height !== 'auto' ? 'hidden' : undefined,
  }

  const imgSrc = p.localData || p.src

  const renderContent = () => {
    switch (comp.type) {
      case 'heading': {
        const Tag = `h${p.level || 2}` as keyof JSX.IntrinsicElements
        const sizeMap: Record<number, string> = { 1: 'text-4xl', 2: 'text-3xl', 3: 'text-2xl', 4: 'text-xl', 5: 'text-lg', 6: 'text-base' }
        return <Tag style={{ color: p.color, textAlign: p.align }} className={`font-bold ${sizeMap[p.level] || 'text-3xl'} m-0`}>{p.text}</Tag>
      }
      case 'text':
        return <p style={{ color: p.color, textAlign: p.align, fontSize: p.fontSize }} className="m-0 leading-relaxed">{p.text}</p>
      case 'image':
        return (
          <div style={{ textAlign: p.align }}>
            {imgSrc ? <img src={imgSrc} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="rounded" /> : <div className="bg-gray-100 rounded flex items-center justify-center h-32 text-gray-400"><Image className="w-8 h-8" /></div>}
            {p.caption && <p className="text-sm text-gray-500 mt-1">{p.caption}</p>}
          </div>
        )
      case 'button': {
        const variantClass = p.variant === 'primary' ? 'bg-indigo-600 text-white' : p.variant === 'outline' ? 'border border-indigo-600 text-indigo-600' : 'bg-gray-100 text-gray-700'
        return <div style={{ textAlign: p.align }}><button className={`px-5 py-2 rounded-md font-medium ${variantClass}`}>{p.text}</button></div>
      }
      case 'divider':
        return <hr style={{ borderColor: p.color, marginTop: p.margin, marginBottom: p.margin, borderStyle: p.style }} />
      case 'card':
        return (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm h-full">
            {p.image && <img src={p.image} alt={p.title} className="w-full h-32 object-cover" />}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{p.title}</h3>
              <p className="text-gray-600 text-sm">{p.content}</p>
            </div>
          </div>
        )
      case 'columns':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns}, 1fr)`, gap: p.gap }}>
            {(p.items || []).map((item: string, i: number) => (
              <div key={i} className="bg-gray-50 rounded p-3 text-sm text-gray-600 min-h-[60px]">{item}</div>
            ))}
          </div>
        )
      case 'video':
        return p.src ? <video src={p.src} poster={p.poster} controls style={{ width: '100%', height: '100%' }} className="rounded" /> : <div className="bg-gray-100 rounded flex items-center justify-center h-32 text-gray-400"><Video className="w-8 h-8" /></div>
      case 'code':
        return <pre className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto text-sm h-full"><code>{p.code}</code></pre>
      case 'quote':
        return (
          <blockquote style={{ borderLeftColor: p.color }} className="border-l-4 pl-4 py-1 h-full">
            <p className="text-gray-700 italic">{p.text}</p>
            {p.author && <cite className="text-sm text-gray-500 not-italic">— {p.author}</cite>}
          </blockquote>
        )
      case 'list':
        return p.ordered
          ? <ol className="list-decimal list-inside space-y-1">{(p.items || []).map((item: string, i: number) => <li key={i} className="text-gray-700">{item}</li>)}</ol>
          : <ul className="list-disc list-inside space-y-1">{(p.items || []).map((item: string, i: number) => <li key={i} className="text-gray-700">{item}</li>)}</ul>
      case 'page-card':
        return (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {p.layout === 'horizontal' ? (
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{p.pageTitle || '选择一个页面'}</h3>
                  {p.showDescription && p.pageDescription && (
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{p.pageDescription}</p>
                  )}
                </div>
                <span className="text-xs text-indigo-500 flex-shrink-0">查看 →</span>
              </div>
            ) : (
              <div className="p-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{p.pageTitle || '选择一个页面'}</h3>
                {p.showDescription && p.pageDescription && (
                  <p className="text-gray-500 text-sm">{p.pageDescription}</p>
                )}
                <span className="text-xs text-indigo-500 mt-2 inline-block">查看详情 →</span>
              </div>
            )}
          </div>
        )
      default:
        return <div className="text-gray-400 text-sm">未知组件</div>
    }
  }

  return (
    <div className={baseClass} style={wrapStyle} onClick={onClick}>
      <div className="p-3 h-full">{renderContent()}</div>
      {selected && (
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-indigo-400" />
        </div>
      )}
    </div>
  )
}

// ==================== 背景编辑面板 ====================
const BackgroundEditor: React.FC<{
  background: PageBackground
  onChange: (bg: PageBackground) => void
}> = ({ background: bg, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const inputClass = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"
  const update = (key: string, value: any) => onChange({ ...bg, [key]: value })

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange({ ...bg, type: 'image', imageLocalData: ev.target?.result as string, imageUrl: '' })
    reader.readAsDataURL(file)
  }

  const clearBgImage = () => onChange({ ...bg, imageLocalData: '', imageUrl: '' })
  const currentBgSrc = bg.imageLocalData || bg.imageUrl

  return (
    <div className="space-y-3">
      {/* 背景类型 */}
      <div>
        <label className={labelClass}>背景类型</label>
        <div className="grid grid-cols-3 gap-1">
          {(['color', 'image', 'gradient'] as const).map(t => (
            <button key={t} onClick={() => update('type', t)} className={`py-1.5 text-xs rounded border transition-colors ${bg.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {t === 'color' ? '纯色' : t === 'image' ? '图片' : '渐变'}
            </button>
          ))}
        </div>
      </div>

      {/* 纯色 */}
      {bg.type === 'color' && (
        <div>
          <label className={labelClass}>背景颜色</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={bg.color || '#ffffff'} onChange={e => update('color', e.target.value)} className="w-10 h-8 rounded border border-gray-300 cursor-pointer" />
            <input type="text" className={inputClass} value={bg.color || '#ffffff'} onChange={e => update('color', e.target.value)} />
          </div>
        </div>
      )}

      {/* 图片背景 */}
      {bg.type === 'image' && (
        <>
          <div>
            <label className={labelClass}>背景图片</label>
            {currentBgSrc ? (
              <div className="relative">
                <img src={currentBgSrc} alt="背景预览" className="w-full h-20 object-cover rounded border border-gray-200" />
                <button onClick={clearBgImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <input type="text" className={inputClass} value={bg.imageUrl ?? ''} onChange={e => onChange({ ...bg, imageUrl: e.target.value, imageLocalData: '' })} placeholder="输入图片URL" />
                <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <Upload className="w-3 h-3" />上传本地图片
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBgFile} />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>图片填充方式</label>
            <select className={inputClass} value={bg.size || 'cover'} onChange={e => update('size', e.target.value)}>
              <option value="cover">铺满(cover)</option>
              <option value="contain">适应(contain)</option>
              <option value="auto">原始大小(auto)</option>
              <option value="100% 100%">拉伸填充</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>重复方式</label>
            <select className={inputClass} value={bg.repeat || 'no-repeat'} onChange={e => update('repeat', e.target.value as any)}>
              <option value="no-repeat">不重复</option>
              <option value="repeat">平铺</option>
              <option value="repeat-x">横向平铺</option>
              <option value="repeat-y">纵向平铺</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>图片位置</label>
            <select className={inputClass} value={bg.position || 'center'} onChange={e => update('position', e.target.value)}>
              <option value="center">居中</option>
              <option value="top">顶部</option>
              <option value="bottom">底部</option>
              <option value="left">左侧</option>
              <option value="right">右侧</option>
              <option value="top left">左上</option>
              <option value="top right">右上</option>
            </select>
          </div>
        </>
      )}

      {/* 渐变背景 */}
      {bg.type === 'gradient' && (
        <div>
          <label className={labelClass}>渐变CSS</label>
          <input type="text" className={inputClass} value={bg.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'} onChange={e => update('gradient', e.target.value)} placeholder="linear-gradient(...)" />
          <p className="text-xs text-gray-400 mt-1">支持标准CSS渐变语法</p>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {[
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            ].map((g, i) => (
              <button key={i} onClick={() => update('gradient', g)} style={{ background: g }} className="h-8 rounded border-2 border-transparent hover:border-indigo-400 transition-colors" title={g} />
            ))}
          </div>
        </div>
      )}

      {/* 透明度 */}
      <div>
        <label className={labelClass}>透明度 ({Math.round((bg.opacity ?? 1) * 100)}%)</label>
        <input type="range" min="0" max="1" step="0.05" value={bg.opacity ?? 1} onChange={e => update('opacity', parseFloat(e.target.value))} className="w-full" />
      </div>

      {/* 背景尺寸 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">背景区域尺寸</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>宽度</label>
            <input className={inputClass} value={bg.width ?? '100%'} onChange={e => update('width', e.target.value)} placeholder="100%" />
          </div>
          <div>
            <label className={labelClass}>高度</label>
            <input className={inputClass} value={bg.height ?? '100%'} onChange={e => update('height', e.target.value)} placeholder="100%" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 页面卡片属性编辑器 ====================
const PageCardEditor: React.FC<{
  props: Record<string, any>
  onChange: (props: Record<string, any>) => void
}> = ({ props: p, onChange }) => {
  const [pages, setPages] = useState<Page[]>([])
  const [loadingPages, setLoadingPages] = useState(true)
  const inputClass = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  useEffect(() => {
    pageService.getPages({ page: 1, limit: 100 })
      .then(res => setPages(res.data.filter((pg: Page) => pg.status === 'published')))
      .catch(() => {})
      .finally(() => setLoadingPages(false))
  }, [])

  const handleSelectPage = (pageId: string) => {
    const selected = pages.find(pg => pg._id === pageId)
    if (selected) {
      onChange({
        ...p,
        pageId: selected._id,
        pageSlug: selected.slug,
        pageTitle: selected.title,
        pageDescription: selected.description || '',
      })
    } else {
      onChange({ ...p, pageId: '', pageSlug: '', pageTitle: '', pageDescription: '' })
    }
  }

  return (
    <>
      <div className="mb-3">
        <label className={labelClass}>选择页面</label>
        {loadingPages ? (
          <div className="text-xs text-gray-400 py-2">加载页面列表...</div>
        ) : pages.length === 0 ? (
          <div className="text-xs text-gray-400 py-2">暂无已发布的页面</div>
        ) : (
          <select
            className={inputClass}
            value={p.pageId || ''}
            onChange={e => handleSelectPage(e.target.value)}
          >
            <option value="">-- 请选择页面 --</option>
            {pages.map(pg => (
              <option key={pg._id} value={pg._id}>{pg.title}</option>
            ))}
          </select>
        )}
      </div>

      {p.pageTitle && (
        <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs font-medium text-indigo-700 truncate">{p.pageTitle}</p>
          {p.pageDescription && (
            <p className="text-xs text-indigo-500 mt-0.5 line-clamp-2">{p.pageDescription}</p>
          )}
          <a
            href={`/page/${p.pageSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
          >
            /page/{p.pageSlug} ↗
          </a>
        </div>
      )}

      <div className="mb-3">
        <label className={labelClass}>卡片布局</label>
        <div className="grid grid-cols-2 gap-1">
          {(['horizontal', 'vertical'] as const).map(layout => (
            <button
              key={layout}
              onClick={() => onChange({ ...p, layout })}
              className={`py-1.5 text-xs rounded border transition-colors ${
                (p.layout || 'horizontal') === layout
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {layout === 'horizontal' ? '横向' : '纵向'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={p.showDescription !== false}
            onChange={e => onChange({ ...p, showDescription: e.target.checked })}
            className="rounded"
          />
          <span className="text-xs font-medium text-gray-600">显示页面摘要</span>
        </label>
      </div>

      <SizeFields props={p} onChange={onChange} />
    </>
  )
}

// ==================== 属性编辑面板 ====================
const PropsEditor: React.FC<{ comp: PageComponent; onChange: (props: Record<string, any>) => void }> = ({ comp, onChange }) => {
  const p = comp.props
  const update = (key: string, value: any) => onChange({ ...p, [key]: value })

  const inputClass = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  const renderField = (label: string, key: string, type: 'text' | 'number' | 'color' | 'textarea' | 'select' | 'checkbox', options?: string[]) => (
    <div className="mb-3" key={key}>
      <label className={labelClass}>{label}</label>
      {type === 'textarea' ? (
        <textarea className={inputClass} rows={3} value={p[key] ?? ''} onChange={e => update(key, e.target.value)} />
      ) : type === 'select' ? (
        <select className={inputClass} value={p[key] ?? ''} onChange={e => update(key, e.target.value)}>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!p[key]} onChange={e => update(key, e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
      ) : (
        <input type={type} className={inputClass} value={p[key] ?? ''} onChange={e => update(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
      )}
    </div>
  )

  const alignField = (key = 'align') => (
    <div className="mb-3">
      <label className={labelClass}>对齐方式</label>
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as const).map(a => {
          const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
          return (
            <button key={a} onClick={() => update(key, a)} className={`flex-1 py-1 rounded border text-xs flex items-center justify-center gap-1 ${p[key] === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="w-3 h-3" />
            </button>
          )
        })}
      </div>
    </div>
  )

  const sizeFields = <SizeFields props={p} onChange={onChange} />

  switch (comp.type) {
    case 'heading':
      return <>{renderField('标题文字', 'text', 'text')}{renderField('标题级别', 'level', 'select', ['1','2','3','4','5','6'])}{alignField()}{renderField('颜色', 'color', 'color')}{sizeFields}</>
    case 'text':
      return <>{renderField('文本内容', 'text', 'textarea')}{alignField()}{renderField('字体大小(px)', 'fontSize', 'number')}{renderField('颜色', 'color', 'color')}{sizeFields}</>
    case 'image':
      return (
        <>
          <ImageUploadField label="图片" urlKey="src" localKey="localData" props={p} onChange={onChange} />
          {renderField('图片描述', 'alt', 'text')}
          {alignField()}
          {renderField('图片说明', 'caption', 'text')}
          {sizeFields}
        </>
      )
    case 'button':
      return <>{renderField('按钮文字', 'text', 'text')}{renderField('链接地址', 'href', 'text')}{renderField('样式', 'variant', 'select', ['primary', 'outline', 'ghost'])}{alignField()}{sizeFields}</>
    case 'divider':
      return <>{renderField('线条样式', 'style', 'select', ['solid', 'dashed', 'dotted'])}{renderField('颜色', 'color', 'color')}{renderField('上下间距(px)', 'margin', 'number')}{sizeFields}</>
    case 'card':
      return (
        <>
          {renderField('卡片标题', 'title', 'text')}
          {renderField('卡片内容', 'content', 'textarea')}
          <ImageUploadField label="封面图" urlKey="image" localKey="imageLocalData" props={p} onChange={onChange} />
          {renderField('链接地址', 'link', 'text')}
          {sizeFields}
        </>
      )
    case 'columns':
      return (
        <>
          {renderField('列数', 'columns', 'select', ['2', '3', '4'])}
          {renderField('间距(px)', 'gap', 'number')}
          <div className="mb-3">
            <label className={labelClass}>各列内容</label>
            {(p.items || []).map((item: string, i: number) => (
              <div key={i} className="flex gap-1 mb-1">
                <input className={inputClass} value={item} onChange={e => { const items = [...p.items]; items[i] = e.target.value; update('items', items) }} placeholder={`第 ${i + 1} 列`} />
              </div>
            ))}
          </div>
          {sizeFields}
        </>
      )
    case 'video':
      return <>{renderField('视频URL', 'src', 'text')}{renderField('封面图URL', 'poster', 'text')}{sizeFields}</>
    case 'code':
      return <>{renderField('代码内容', 'code', 'textarea')}{renderField('编程语言', 'language', 'select', ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'html', 'css', 'bash', 'json'])}{sizeFields}</>
    case 'quote':
      return <>{renderField('引用内容', 'text', 'textarea')}{renderField('作者', 'author', 'text')}{renderField('左边框颜色', 'color', 'color')}{sizeFields}</>
    case 'list':
      return (
        <>
          {renderField('有序列表', 'ordered', 'checkbox')}
          <div className="mb-3">
            <label className={labelClass}>列表项</label>
            {(p.items || []).map((item: string, i: number) => (
              <div key={i} className="flex gap-1 mb-1">
                <input className={inputClass} value={item} onChange={e => { const items = [...p.items]; items[i] = e.target.value; update('items', items) }} />
                <button onClick={() => update('items', p.items.filter((_: any, j: number) => j !== i))} className="text-red-400 hover:text-red-600 px-1"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => update('items', [...(p.items || []), '新列表项'])} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1"><Plus className="w-3 h-3" />添加列表项</button>
          </div>
          {sizeFields}
        </>
      )
    case 'page-card':
      return <PageCardEditor props={p} onChange={onChange} />
    default:
      return <div className="text-gray-400 text-sm">暂无可编辑属性</div>
  }
}

// ==================== 背景预览层 ====================
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
    borderRadius: 'inherit',
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
    style.backgroundImage = bg.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  return <div style={style} />
}

// ==================== 主设计器组件 ====================
const DEFAULT_BACKGROUND: PageBackground = { type: 'color', color: '#ffffff', opacity: 1, width: '100%', height: '100%' }

const PageDesigner: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id

  const [title, setTitle] = useState('新建页面')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'published' | 'draft'>('draft')
  const [components, setComponents] = useState<PageComponent[]>([])
  const [background, setBackground] = useState<PageBackground>(DEFAULT_BACKGROUND)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'components' | 'settings'>('components')
  const [rightTab, setRightTab] = useState<'props' | 'background'>('props')
  const [loading, setLoading] = useState(isEdit)

  // 加载已有页面数据
  React.useEffect(() => {
    if (isEdit && id) {
      pageService.getPage(id).then(page => {
        setTitle(page.title)
        setSlug(page.slug)
        setDescription(page.description || '')
        setStatus(page.status)
        setComponents(page.components)
        if (page.background) setBackground(page.background)
        setLoading(false)
      }).catch(() => {
        toast.error('加载页面失败')
        navigate('/admin/pages')
      })
    }
  }, [id, isEdit, navigate])

  const genId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5)

  const addComponent = useCallback((type: ComponentType) => {
    const catalog = COMPONENT_CATALOG.find(c => c.type === type)!
    const newComp: PageComponent = { id: genId(), type, props: { ...catalog.defaultProps } }
    setComponents(prev => [...prev, newComp])
    setSelectedId(newComp.id)
    setRightTab('props')
  }, [])

  const removeComponent = useCallback((compId: string) => {
    setComponents(prev => prev.filter(c => c.id !== compId))
    setSelectedId(null)
  }, [])

  const moveComponent = useCallback((compId: string, dir: 'up' | 'down') => {
    setComponents(prev => {
      const idx = prev.findIndex(c => c.id === compId)
      if (idx < 0) return prev
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }, [])

  const updateComponentProps = useCallback((compId: string, props: Record<string, any>) => {
    setComponents(prev => prev.map(c => c.id === compId ? { ...c, props } : c))
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { toast.error('请填写页面标题'); return }
    if (!slug.trim()) { toast.error('请填写路径标识'); return }
    if (!/^[a-z0-9-]+$/.test(slug)) { toast.error('路径标识只能包含小写字母、数字和连字符'); return }

    setSaving(true)
    try {
      const data: CreatePageData = { title, slug, description, components, background, status }
      if (isEdit && id) {
        await pageService.updatePage(id, data)
        toast.success('页面已保存！')
      } else {
        const page = await pageService.createPage(data)
        toast.success('页面创建成功！')
        navigate(`/admin/pages/edit/${page._id}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const selectedComp = components.find(c => c.id === selectedId)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
  }

  // 画布背景样式（仅预览用，不影响实际尺寸）
  const canvasBgStyle: React.CSSProperties = {}
  if (background.type === 'color') canvasBgStyle.backgroundColor = background.color
  else if (background.type === 'image') {
    const src = background.imageLocalData || background.imageUrl
    if (src) {
      canvasBgStyle.backgroundImage = `url(${src})`
      canvasBgStyle.backgroundSize = background.size || 'cover'
      canvasBgStyle.backgroundPosition = background.position || 'center'
      canvasBgStyle.backgroundRepeat = background.repeat || 'no-repeat'
    }
  } else if (background.type === 'gradient') {
    canvasBgStyle.backgroundImage = background.gradient
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/pages')} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 border-none outline-none bg-transparent focus:bg-gray-50 rounded px-2 py-0.5 min-w-[200px]"
            placeholder="页面标题"
          />
          <span className={`px-2 py-0.5 text-xs rounded-full ${status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {status === 'published' ? '已发布' : '草稿'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {slug && status === 'published' && (
            <a href={`/page/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
              <Eye className="w-4 h-4" />预览
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60">
            <Save className="w-4 h-4" />{saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧面板：组件库 + 设置 */}
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('components')} className={`flex-1 py-2.5 text-sm font-medium ${activeTab === 'components' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              组件库
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2.5 text-sm font-medium ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              页面设置
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'components' ? (
              <div className="grid grid-cols-2 gap-2">
                {COMPONENT_CATALOG.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => addComponent(type)}
                    className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="text-xs text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">路径标识 (slug)</label>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="my-page"
                  />
                  {slug && <p className="text-xs text-gray-400 mt-1">访问地址：/page/{slug}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">页面描述</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    rows={3}
                    placeholder="页面描述（可选）"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">发布状态</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'published' | 'draft')}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">发布</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间：画布 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="max-w-3xl mx-auto rounded-xl shadow-sm border border-gray-200 min-h-[600px] p-8 relative"
            style={{ ...canvasBgStyle, opacity: background.opacity ?? 1 }}
          >
            {/* 背景层（z-index: 0） */}
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
              {/* 背景已通过父元素样式渲染 */}
            </div>

            {/* 内容层（z-index: 1） */}
            <div className="relative" style={{ zIndex: 1 }}>
              {components.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Plus className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">从左侧选择组件添加到页面</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((comp, idx) => (
                    <div key={comp.id} className="relative group">
                      <ComponentPreview
                        comp={comp}
                        selected={selectedId === comp.id}
                        onClick={() => { setSelectedId(comp.id); setRightTab('props') }}
                      />
                      {/* 悬浮操作按钮 */}
                      <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveComponent(comp.id, 'up')} disabled={idx === 0} className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveComponent(comp.id, 'down')} disabled={idx === components.length - 1} className="p-1 bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => removeComponent(comp.id)} className="p-1 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：属性编辑 + 背景设置 */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          {/* 右侧 Tab */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setRightTab('props')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${rightTab === 'props' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Settings className="w-3.5 h-3.5" />属性
            </button>
            <button
              onClick={() => setRightTab('background')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${rightTab === 'background' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers className="w-3.5 h-3.5" />背景
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'props' ? (
              selectedComp ? (
                <PropsEditor
                  comp={selectedComp}
                  onChange={props => updateComponentProps(selectedComp.id, props)}
                />
              ) : (
                <div className="text-center text-gray-400 text-sm mt-8">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>点击画布中的组件<br />即可编辑其属性</p>
                </div>
              )
            ) : (
              <BackgroundEditor background={background} onChange={setBackground} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PageDesigner
