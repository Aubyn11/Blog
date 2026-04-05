import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save, Plus, Trash2, GripVertical, Eye, EyeOff,
  Upload, X, Link as LinkIcon, User, Type, AlignLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { HomeConfig, SocialLink, HomeSection } from '../../types'
import { homeConfigService } from '../../services/api'

// 预设社交平台
const SOCIAL_PLATFORMS = [
  { name: 'GitHub', icon: '🐙' },
  { name: 'Twitter / X', icon: '🐦' },
  { name: '微博', icon: '📝' },
  { name: '知乎', icon: '🔵' },
  { name: 'B站', icon: '📺' },
  { name: '掘金', icon: '💎' },
  { name: '邮箱', icon: '📧' },
  { name: '个人网站', icon: '🌐' },
]

// 主题色选项
const ACCENT_COLORS = [
  { label: '靛蓝', value: 'indigo' },
  { label: '紫色', value: 'purple' },
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '玫瑰', value: 'rose' },
  { label: '橙色', value: 'orange' },
]

const DEFAULT_CONFIG: HomeConfig = {
  name: '博主',
  title: '',
  bio: '这里是我的个人博客，记录技术探索、生活感悟与创意想法。',
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

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ==================== 子组件 ====================

const SectionItem: React.FC<{
  section: HomeSection
  onChange: (s: HomeSection) => void
  onDelete: () => void
}> = ({ section, onChange, onDelete }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white">
    <div className="flex items-center gap-2 mb-3">
      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
      <input
        className="flex-1 text-sm font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-indigo-400 pb-0.5"
        placeholder="区块标题（可选）"
        value={section.title || ''}
        onChange={e => onChange({ ...section, title: e.target.value })}
      />
      <button
        onClick={() => onChange({ ...section, visible: !section.visible })}
        className="p-1 text-gray-400 hover:text-gray-600"
        title={section.visible ? '隐藏' : '显示'}
      >
        {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    <textarea
      className="w-full text-sm text-gray-700 border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
      rows={3}
      placeholder="支持 Markdown 格式的内容..."
      value={section.content || ''}
      onChange={e => onChange({ ...section, content: e.target.value })}
    />
  </div>
)

// ==================== 主组件 ====================

const HomeSettings: React.FC = () => {
  const navigate = useNavigate()
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'sections'>('profile')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await homeConfigService.getHomeConfig()
      if (data) setConfig({ ...DEFAULT_CONFIG, ...data })
    } catch {
      // 使用默认配置
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await homeConfigService.saveHomeConfig(config)
      toast.success('主页配置已保存')
    } catch {
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  // 头像本地上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setConfig(c => ({ ...c, avatarLocalData: ev.target?.result as string, avatarUrl: '' }))
    }
    reader.readAsDataURL(file)
  }

  // 社交链接操作
  const addSocialLink = () => {
    setConfig(c => ({
      ...c,
      socialLinks: [...c.socialLinks, { id: genId(), platform: 'GitHub', url: '', icon: '🐙' }]
    }))
  }

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    setConfig(c => ({
      ...c,
      socialLinks: c.socialLinks.map(l => l.id === id ? { ...l, ...updates } : l)
    }))
  }

  const deleteSocialLink = (id: string) => {
    setConfig(c => ({ ...c, socialLinks: c.socialLinks.filter(l => l.id !== id) }))
  }

  // 自定义区块操作
  const addSection = () => {
    setConfig(c => ({
      ...c,
      sections: [...c.sections, { id: genId(), type: 'text', title: '', content: '', visible: true }]
    }))
  }

  const updateSection = (id: string, updated: HomeSection) => {
    setConfig(c => ({ ...c, sections: c.sections.map(s => s.id === id ? updated : s) }))
  }

  const deleteSection = (id: string) => {
    setConfig(c => ({ ...c, sections: c.sections.filter(s => s.id !== id) }))
  }

  const avatarSrc = config.avatarLocalData || config.avatarUrl

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  const TABS = [
    { key: 'profile', label: '基本信息', icon: User },
    { key: 'links', label: '社交链接', icon: LinkIcon },
    { key: 'sections', label: '自定义区块', icon: AlignLeft },
  ] as const

  return (
    <div className="p-6 sm:p-8 max-w-3xl">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">主页设置</h1>
          <p className="text-gray-500 text-sm mt-1">自定义访客看到的主页内容</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            预览
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ===== Tab: 基本信息 ===== */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          {/* 头像 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> 头像
            </h3>
            <div className="flex items-center gap-5">
              {/* 预览 */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden shadow">
                {avatarSrc
                  ? <img src={avatarSrc} alt="头像" className="w-full h-full object-cover" />
                  : <span className="text-3xl">{config.avatarEmoji || '👤'}</span>
                }
              </div>
              <div className="flex-1 space-y-2">
                {/* Emoji 头像 */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Emoji 头像</label>
                  <input
                    className="w-24 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="👤"
                    value={config.avatarEmoji || ''}
                    onChange={e => setConfig(c => ({ ...c, avatarEmoji: e.target.value, avatarLocalData: '', avatarUrl: '' }))}
                  />
                </div>
                {/* 图片 URL */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">图片 URL</label>
                  <input
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="https://..."
                    value={config.avatarUrl || ''}
                    onChange={e => setConfig(c => ({ ...c, avatarUrl: e.target.value, avatarLocalData: '', avatarEmoji: '' }))}
                  />
                </div>
                {/* 本地上传 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-xs text-gray-600 rounded-md hover:bg-gray-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    上传本地图片
                  </button>
                  {(config.avatarLocalData || config.avatarUrl) && (
                    <button
                      onClick={() => setConfig(c => ({ ...c, avatarLocalData: '', avatarUrl: '', avatarEmoji: '👤' }))}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                      <X className="w-3.5 h-3.5" /> 清除图片
                    </button>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
              </div>
            </div>
          </div>

          {/* 基本信息 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Type className="w-4 h-4" /> 博主信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">博主名称 *</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="你的名字"
                  value={config.name}
                  onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">职位/头衔</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="全栈开发者"
                  value={config.title || ''}
                  onChange={e => setConfig(c => ({ ...c, title: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">个人简介</label>
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                rows={3}
                placeholder="简单介绍一下自己..."
                value={config.bio}
                onChange={e => setConfig(c => ({ ...c, bio: e.target.value }))}
              />
            </div>
          </div>

          {/* 按钮设置 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">主页按钮</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">主按钮文字</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="阅读博客"
                  value={config.primaryBtnText || ''}
                  onChange={e => setConfig(c => ({ ...c, primaryBtnText: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">主按钮链接</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="/blog"
                  value={config.primaryBtnLink || ''}
                  onChange={e => setConfig(c => ({ ...c, primaryBtnLink: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">次按钮文字</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="联系我（留空则不显示）"
                  value={config.secondaryBtnText || ''}
                  onChange={e => setConfig(c => ({ ...c, secondaryBtnText: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">次按钮链接</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="https://..."
                  value={config.secondaryBtnLink || ''}
                  onChange={e => setConfig(c => ({ ...c, secondaryBtnLink: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 主题色 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">主题色</h3>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setConfig(c => ({ ...c, accentColor: value }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    config.accentColor === value
                      ? 'border-gray-800 bg-gray-800 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== Tab: 社交链接 ===== */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          {config.socialLinks.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white border border-dashed border-gray-200 rounded-xl">
              暂无社交链接，点击下方按钮添加
            </div>
          )}
          {config.socialLinks.map(link => (
            <div key={link.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{link.icon || '🔗'}</span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">平台</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={link.platform}
                    onChange={e => {
                      const preset = SOCIAL_PLATFORMS.find(p => p.name === e.target.value)
                      updateSocialLink(link.id, { platform: e.target.value, icon: preset?.icon || '🔗' })
                    }}
                  >
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p.name} value={p.name}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">链接 URL</label>
                  <input
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="https://..."
                    value={link.url}
                    onChange={e => updateSocialLink(link.id, { url: e.target.value })}
                  />
                </div>
              </div>
              <button onClick={() => deleteSocialLink(link.id)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addSocialLink}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-indigo-300 text-indigo-600 text-sm rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加社交链接
          </button>
        </div>
      )}

      {/* ===== Tab: 自定义区块 ===== */}
      {activeTab === 'sections' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">自定义区块会显示在主页下方，支持 Markdown 格式。</p>
          {config.sections.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white border border-dashed border-gray-200 rounded-xl">
              暂无自定义区块，点击下方按钮添加
            </div>
          )}
          {config.sections.map(section => (
            <SectionItem
              key={section.id}
              section={section}
              onChange={updated => updateSection(section.id, updated)}
              onDelete={() => deleteSection(section.id)}
            />
          ))}
          <button
            onClick={addSection}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-indigo-300 text-indigo-600 text-sm rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加自定义区块
          </button>
        </div>
      )}
    </div>
  )
}

export default HomeSettings
