import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Upload, Users, Eye, Heart, Layout } from 'lucide-react'
import { Post } from '../../types'
import { postService } from '../../services/api'

const Dashboard: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    publishedPosts: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const postsResponse = await postService.getPosts({ page: 1, limit: 5 })
      setRecentPosts(postsResponse.data)
      
      // 模拟统计数据
      setStats({
        totalPosts: postsResponse.total,
        totalViews: postsResponse.data.reduce((sum, post) => sum + post.views, 0),
        totalLikes: postsResponse.data.reduce((sum, post) => sum + post.likes, 0),
        publishedPosts: postsResponse.data.filter(post => post.status === 'published').length
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const statCards = [
    {
      title: '总文章数',
      value: stats.totalPosts,
      icon: FileText,
      color: 'blue'
    },
    {
      title: '已发布',
      value: stats.publishedPosts,
      icon: FileText,
      color: 'green'
    },
    {
      title: '总阅读量',
      value: stats.totalViews,
      icon: Eye,
      color: 'purple'
    },
    {
      title: '总点赞数',
      value: stats.totalLikes,
      icon: Heart,
      color: 'red'
    }
  ]

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-600">欢迎回来！这是您的博客数据概览。</p>
      </div>

      {/* 快速操作 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建文章
          </Link>
          <Link
            to="/admin/files"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            管理文件
          </Link>
          <Link
            to="/admin/pages"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Layout className="w-4 h-4 mr-2" />
            页面设计器
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 最近文章 */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">最近文章</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPosts.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文章</h3>
              <p className="mt-1 text-sm text-gray-500">开始创建您的第一篇博客文章。</p>
              <div className="mt-6">
                <Link
                  to="/admin/posts/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建文章
                </Link>
              </div>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      to={`/blog/${post._id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        <span>{post.likes}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard