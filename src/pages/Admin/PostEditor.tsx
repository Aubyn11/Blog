import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, ArrowLeft, Eye, EyeOff, Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3, Minus, Undo, Redo } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { marked } from 'marked'
import * as DOMPurify from 'dompurify'

// DOMPurify 兼容包装
const purify = (DOMPurify as any).default ?? DOMPurify
import { postService } from '../../services/api'
import { CreatePostData } from '../../types'
import toast from 'react-hot-toast'

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 工具栏按钮组件
interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded text-sm transition-colors ${
      active
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    } disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const PostEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    status: 'draft',
  })
  const [tagInput, setTagInput] = useState('')

  // 初始化 Tiptap 编辑器
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: { class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto' },
        },
        blockquote: {
          HTMLAttributes: { class: 'border-l-4 border-primary-400 pl-4 italic text-gray-600' },
        },
      }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      // 将编辑器内容同步到 formData（存储为 HTML）
      setFormData(prev => ({ ...prev, content: editor.getHTML() }))
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  })

  useEffect(() => {
    if (isEditing && id) {
      fetchPost(id)
    }
  }, [id])

  const fetchPost = async (postId: string) => {
    setLoading(true)
    try {
      const post = await postService.getPost(postId)
      const content = post.content || ''
      setFormData({
        title: post.title,
        content,
        excerpt: post.excerpt,
        tags: post.tags,
        status: post.status,
      })
      // 将已有内容加载到编辑器
      if (editor) {
        editor.commands.setContent(content)
      }
    } catch (error) {
      toast.error('获取文章失败')
      navigate('/admin/posts')
    } finally {
      setLoading(false)
    }
  }

  // 编辑器加载完成后，如果已有内容则填充
  useEffect(() => {
    if (editor && formData.content && editor.isEmpty) {
      editor.commands.setContent(formData.content)
    }
  }, [editor, formData.content])

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

  // 获取纯文本用于摘要自动生成
  const getPlainText = useCallback(() => {
    if (editor) {
      return editor.getText()
    }
    return formData.content.replace(/<[^>]+>/g, '')
  }, [editor, formData.content])

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!formData.title.trim()) {
      toast.error('请输入文章标题')
      return
    }
    const content = editor ? editor.getHTML() : formData.content
    if (!content || content === '<p></p>') {
      toast.error('请输入文章内容')
      return
    }

    const plainText = getPlainText()
    const submitData = {
      ...formData,
      content,
      status,
      excerpt: formData.excerpt || plainText.substring(0, 200) + '...',
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

  // 生成预览 HTML（安全渲染）
  const getPreviewHtml = useCallback(() => {
    const content = editor ? editor.getHTML() : formData.content
    const clean = purify.sanitize(content)
    return clean
  }, [editor, formData.content])

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

        {/* 富文本编辑器 */}
        <div className="card overflow-hidden">
          {/* 编辑器标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              文章内容 <span className="text-red-500">*</span>
            </span>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                previewMode
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              {previewMode ? '退出预览' : '预览'}
            </button>
          </div>

          {!previewMode ? (
            <>
              {/* 工具栏 */}
              <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-white">
                {/* 撤销/重做 */}
                <ToolbarButton
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  title="重做 (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* 标题 */}
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  active={editor?.isActive('heading', { level: 1 })}
                  title="一级标题"
                >
                  <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  active={editor?.isActive('heading', { level: 2 })}
                  title="二级标题"
                >
                  <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  active={editor?.isActive('heading', { level: 3 })}
                  title="三级标题"
                >
                  <Heading3 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* 文本格式 */}
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  active={editor?.isActive('bold')}
                  title="加粗 (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive('italic')}
                  title="斜体 (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleCode().run()}
                  active={editor?.isActive('code')}
                  title="行内代码"
                >
                  <Code className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-1" />

                {/* 列表 */}
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  active={editor?.isActive('bulletList')}
                  title="无序列表"
                >
                  <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  active={editor?.isActive('orderedList')}
                  title="有序列表"
                >
                  <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  active={editor?.isActive('blockquote')}
                  title="引用"
                >
                  <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  active={editor?.isActive('codeBlock')}
                  title="代码块"
                >
                  <span className="text-xs font-mono font-bold px-0.5">{'</>'}</span>
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                  title="分割线"
                >
                  <Minus className="w-4 h-4" />
                </ToolbarButton>
              </div>

              {/* 编辑区域 */}
              <div className="min-h-[400px] border-0">
                <EditorContent editor={editor} />
              </div>
            </>
          ) : (
            /* 预览区域 */
            <div
              className="prose prose-sm sm:prose max-w-none px-6 py-4 min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
          )}
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
