import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Tag, Clock } from 'lucide-react'
import { HomeConfig } from '../../types'
import { homeConfigService } from '../../services/api'

// 默认配置（后端未配置时的兜底）
const DEFAULT_CONFIG: HomeConfig = {
  name: '博主',
  title: '',
  bio: '这里是我的个人博客，记录技术探索、生活感悟与创意想法。欢迎你的到来，希望这里的内容对你有所帮助。',
  avatarEmoji: '👤',
  avatarUrl: '',
  avatarLocalData: '',
  socialLinks: [],
  primaryBtnText: '阅读博客',
  primaryBtnLink: '/blog',
  secondaryBtnText: '',
  secondaryBtnLink: '',
  sections: [],
  accentColor: 'indigo',
}

// 主题色映射
const COLOR_MAP: Record<string, { bg: string; text: string; hover: string; border: string; light: string }> = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:bg-indigo-700', border: 'hover:border-indigo-300', light: 'bg-indigo-50' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-600', hover: 'hover:bg-purple-700', border: 'hover:border-purple-300', light: 'bg-purple-50' },
  blue:   { bg: 'bg-blue-600',   text: 'text-blue-600',   hover: 'hover:bg-blue-700',   border: 'hover:border-blue-300',   light: 'bg-blue-50'   },
  green:  { bg: 'bg-green-600',  text: 'text-green-600',  hover: 'hover:bg-green-700',  border: 'hover:border-green-300',  light: 'bg-green-50'  },
  rose:   { bg: 'bg-rose-600',   text: 'text-rose-600',   hover: 'hover:bg-rose-700',   border: 'hover:border-rose-300',   light: 'bg-rose-50'   },
  orange: { bg: 'bg-orange-500', text: 'text-orange-600', hover: 'hover:bg-orange-600', border: 'hover:border-orange-300', light: 'bg-orange-50' },
}

const Home: React.FC = () => {
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    homeConfigService.getHomeConfig()
      .then(data => { if (data) setConfig({ ...DEFAULT_CONFIG, ...data }) })
      .catch(() => {/* 使用默认配置 */})
      .finally(() => setLoading(false))
  }, [])

  const color = COLOR_MAP[config.accentColor || 'indigo'] || COLOR_MAP.indigo
  const avatarSrc = config.avatarLocalData || config.avatarUrl

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="py-10">
      {/* Hero：博主介绍 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* 头像 */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg overflow-hidden">
              {avatarSrc
                ? <img src={avatarSrc} alt={config.name} className="w-full h-full object-cover" />
                : <span className="text-4xl">{config.avatarEmoji || '👤'}</span>
              }
            </div>
          </div>

          {/* 介绍文字 */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
              你好，我是{' '}
              <span className={color.text}>{config.name}</span>
              {' '}👋
            </h1>
            {config.title && (
              <p className="text-gray-400 text-sm mb-2">{config.title}</p>
            )}
            <p className="text-gray-500 text-lg leading-relaxed mb-4">{config.bio}</p>

            {/* 按钮 */}
            <div className="flex flex-wrap gap-3">
              {config.primaryBtnText && config.primaryBtnLink && (
                <Link
                  to={config.primaryBtnLink}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 ${color.bg} ${color.hover} text-white text-sm font-medium rounded-lg transition-colors`}
                >
                  <BookOpen className="w-4 h-4" />
                  {config.primaryBtnText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {config.secondaryBtnText && config.secondaryBtnLink && (
                <a
                  href={config.secondaryBtnLink}
                  target={config.secondaryBtnLink.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {config.secondaryBtnText}
                </a>
              )}
            </div>

            {/* 社交链接 */}
            {config.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {config.socialLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full transition-colors"
                  >
                    <span>{link.icon}</span>
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 分割线 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
        <hr className="border-gray-200" />
      </div>

      {/* 快捷导航卡片 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">探索内容</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/blog"
            className={`group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 ${color.border} hover:shadow-md transition-all`}
          >
            <div className={`w-10 h-10 ${color.light} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <BookOpen className={`w-5 h-5 ${color.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">全部文章</h3>
              <p className="text-sm text-gray-500">浏览所有博客文章</p>
            </div>
          </Link>

          <Link
            to="/blog"
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">分类标签</h3>
              <p className="text-sm text-gray-500">按主题浏览内容</p>
            </div>
          </Link>

          <Link
            to="/blog"
            className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">最新发布</h3>
              <p className="text-sm text-gray-500">查看最近更新的文章</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 自定义区块 */}
      {config.sections.filter(s => s.visible).length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">
          {config.sections.filter(s => s.visible).map(section => (
            <div key={section.id} className="bg-white rounded-2xl p-6 border border-gray-200">
              {section.title && (
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{section.title}</h2>
              )}
              {section.content && (
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

export default Home