import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react'
import { Post } from '../../types'
import { postService } from '../../services/api'
import toast from 'react-hot-toast'

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await postService.getPosts({ page: 1, limit: 50 })
      setPosts(response.data)
    } catch (error) {
      toast.error('获取文章列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可恢复。')) {
      return
    }

    try {
      await postService.deletePost(id)
      toast.success('文章删除成功')
      setPosts(posts.filter(post => post._id !== id))
    } catch (error) {
      toast.error('删除文章失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
          <p className="text-gray-600">管理您的博客文章</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建文章
        </Link>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">文章列表</h3>
        </div>
        
        {posts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文章</h3>
            <p className="text-gray-500 mb-4">开始创建您的第一篇博客文章</p>
            <Link
              to="/admin/posts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建文章
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {posts.map((post) => (
              <div key={post._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{post.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{post.author.username}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{post.views} 阅读</span>
                      </div>
                    </div>
                    
                    {post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/blog/${post._id}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/admin/posts/edit/${post._id}`}
                      className="p-2 text-gray-400 hover:text-blue-500"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="删除"
                    >
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

export default PostList