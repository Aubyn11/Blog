import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { postService } from '../../services/api'
import { CreatePostData } from '../../types'
import toast from 'react-hot-toast'

const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    status: 'draft',
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (isEditing && id) {
      fetchPost(id)
    }
  }, [id])

  const fetchPost = async (postId: string) => {
    setLoading(true)
    try {
      const post = await postService.getPost(postId)
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        tags: post.tags,
        status: post.status,
      })
    } catch (error) {
      toast.error('获取文章失败')
      navigate('/admin/posts')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }))
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题')
      return
    }
    if (!formData.content.trim()) {
      toast.error('请输入文章内容')
      return
    }

    const submitData = {
      ...formData,
      status,
      excerpt: formData.excerpt || formData.content.substring(0, 200) + '...',
    }

    setSaving(true)
    try {
      if (isEditing && id) {
        await postService.updatePost(id, submitData)
        toast.success('文章更新成功')
      } else {
        await postService.createPost(submitData)
        toast.success('文章创建成功')
      }
      navigate('/admin/posts')
    } catch (error) {
      toast.error(isEditing ? '更新文章失败' : '创建文章失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      {/* 顶部操作栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/posts')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? '编辑文章' : '新建文章'}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            保存草稿
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            {saving ? '发布中...' : '发布文章'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 标题 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文章标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="请输入文章标题..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>

        {/* 内容 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文章内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="请输入文章内容（支持 Markdown 格式）..."
            rows={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-y"
          />
        </div>

        {/* 摘要 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文章摘要
            <span className="text-gray-400 text-xs ml-2">（不填则自动截取内容前200字）</span>
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="请输入文章摘要..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 标签 */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文章标签
            <span className="text-gray-400 text-xs ml-2">（输入后按 Enter 添加）</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-primary-500 hover:text-primary-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="输入标签后按 Enter..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end space-x-3 pb-8">
          <button
            onClick={() => navigate('/admin/posts')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            保存草稿
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? '处理中...' : (isEditing ? '更新发布' : '发布文章')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostEditor
