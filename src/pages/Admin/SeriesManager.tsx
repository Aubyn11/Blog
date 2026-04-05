import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Edit2, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

interface SeriesPost {
  post: { _id: string; title: string; excerpt: string; status: string; createdAt: string }
  order: number
}

interface Series {
  _id: string
  title: string
  description: string
  coverImage?: string
  posts: SeriesPost[]
  status: 'published' | 'draft'
  tags: string[]
  createdAt: string
}

const SeriesManager: React.FC = () => {
  const { token } = useAuth()
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', tags: '', status: 'draft' as 'draft' | 'published' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchSeries() }, [])

  const fetchSeries = async () => {
    try {
      setLoading(true)
      const res = await api.get('/series', { params: { status: 'all' } })
      setSeriesList(res.data?.data?.data || res.data?.data || [])
    } catch {
      toast.error('获取系列列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('请输入系列标题')
    setSaving(true)
    try {
      const body = {
        title: form.title,
        description: form.description,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: form.status,
      }
      if (editingId) {
        await api.put(`/series/${editingId}`, body)
        toast.success('系列更新成功')
      } else {
        await api.post('/series', body)
        toast.success('系列创建成功')
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ title: '', description: '', tags: '', status: 'draft' })
      fetchSeries()
    } catch {
      toast.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (s: Series) => {
    setForm({ title: s.title, description: s.description || '', tags: (s.tags || []).join(', '), status: s.status })
    setEditingId(s._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此系列？文章不会被删除。')) return
    try {
      await api.delete(`/series/${id}`)
      toast.success('系列已删除')
      fetchSeries()
    } catch {
      toast.error('删除失败')
    }
  }

  const handleToggleStatus = async (s: Series) => {
    try {
      await api.put(`/series/${s._id}`, { status: s.status === 'published' ? 'draft' : 'published' })
      toast.success(s.status === 'published' ? '已设为草稿' : '已发布')
      fetchSeries()
    } catch {
      toast.error('操作失败')
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章系列</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">将相关文章组织成系列/专栏</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', description: '', tags: '', status: 'draft' }) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />新建系列
        </button>
      </div>

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingId ? '编辑系列' : '新建系列'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">系列标题 *</label>
              <input
                className="input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="例如：React 从入门到精通"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">系列描述</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="简要描述这个系列的内容..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签（逗号分隔）</label>
              <input
                className="input"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="react, typescript, 前端"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
              <select
                className="input"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 系列列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">还没有系列，点击「新建系列」开始吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seriesList.map(s => (
            <div key={s._id} className="card overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{s.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${s.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {s.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </div>
                  {s.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{s.posts?.length || 0} 篇文章</span>
                    {(s.tags || []).length > 0 && (
                      <span>{s.tags.map(t => `#${t}`).join(' ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggleStatus(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded" title={s.status === 'published' ? '设为草稿' : '发布'}>
                    {s.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === s._id ? null : s._id)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
                    {expandedId === s._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 展开：文章列表 */}
              {expandedId === s._id && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-5 py-4">
                  {(s.posts || []).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">此系列暂无文章</p>
                  ) : (
                    <ol className="space-y-2">
                      {[...s.posts].sort((a, b) => a.order - b.order).map((sp, idx) => (
                        <li key={sp.post?._id || idx} className="flex items-center gap-3 text-sm">
                          <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          <span className="text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                          {sp.post ? (
                            <Link to={`/blog/${sp.post._id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline truncate flex-1">
                              {sp.post.title}
                            </Link>
                          ) : (
                            <span className="text-gray-400 italic">文章已删除</span>
                          )}
                          <span className={`px-1.5 py-0.5 text-xs rounded flex-shrink-0 ${sp.post?.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {sp.post?.status === 'published' ? '已发布' : '草稿'}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SeriesManager
