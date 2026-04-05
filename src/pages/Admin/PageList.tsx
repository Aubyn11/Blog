import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Calendar, Layout } from 'lucide-react'
import { Page } from '../../types'
import { pageService } from '../../services/api'
import toast from 'react-hot-toast'

const PageList: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await pageService.getPages({ page: 1, limit: 50 })
      setPages(response.data)
    } catch {
      toast.error('获取页面列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`确定要删除页面「${title}」吗？此操作不可恢复。`)) return
    try {
      await pageService.deletePage(id)
      toast.success('页面删除成功')
      setPages(pages.filter(p => p._id !== id))
    } catch {
      toast.error('删除页面失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">页面管理</h1>
          <p className="text-gray-600">使用可视化设计器创建自定义页面</p>
        </div>
        <Link
          to="/admin/pages/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建页面
        </Link>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">页面列表</h3>
        </div>

        {pages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Layout className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无自定义页面</h3>
            <p className="text-gray-500 mb-4">使用可视化设计器创建您的第一个自定义页面</p>
            <Link
              to="/admin/pages/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建页面
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pages.map(page => (
              <div key={page._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-medium text-gray-900">{page.title}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {page.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    {page.description && <p className="text-sm text-gray-500 mb-1">{page.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">/page/{page.slug}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(page.createdAt).toLocaleDateString()}
                      </div>
                      <span>{page.components?.length || 0} 个组件</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {page.status === 'published' && (
                      <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-500" title="预览">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <Link to={`/admin/pages/edit/${page._id}`} className="p-2 text-gray-400 hover:text-indigo-500" title="编辑">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(page._id, page.title)} className="p-2 text-gray-400 hover:text-red-500" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageList
