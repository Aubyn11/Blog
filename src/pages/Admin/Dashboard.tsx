import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Upload, Users, Eye, Heart, Layout, TrendingUp, BarChart2, Rss } from 'lucide-react'
import { Post } from '../../types'
import { postService } from '../../services/api'

// 简单迷你柱状图组件
const MiniBarChart: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#3b82f6' }) => {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(4, (val / max) * 40)}px`,
            backgroundColor: color,
            opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5,
          }}
          title={`${val}`}
        />
      ))}
    </div>
  )
}

// 生成最近N天的日期标签
const getRecentDays = (n: number) => {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
}

const Dashboard: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    publishedPosts: 0,
    draftPosts: 0,
  })
  const [viewsTrend, setViewsTrend] = useState<number[]>(Array(7).fill(0))
  const [topPosts, setTopPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 获取最近5篇
      const recentRes = await postService.getPosts({ page: 1, limit: 5 })
      setRecentPosts(recentRes.data)

      // 获取更多文章用于统计（最多100篇）
      const allRes = await postService.getPosts({ page: 1, limit: 100 } as any)
      const posts: Post[] = allRes.data
      setAllPosts(posts)

      const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0)
      const totalLikes = posts.reduce((sum, p) => {
        const l = p.likes
        return sum + (typeof l === 'number' ? l : (l as any)?.length || 0)
      }, 0)
      const publishedPosts = posts.filter(p => p.status === 'published').length
      const draftPosts = posts.filter(p => p.status === 'draft').length

      setStats({
        totalPosts: allRes.total || posts.length,
        totalViews,
        totalLikes,
        publishedPosts,
        draftPosts,
      })

      // 阅读量趋势：按文章创建日期分组（近7天）
      const trend = Array(7).fill(0)
      const now = new Date()
      posts.forEach(post => {
        const created = new Date(post.createdAt)
        const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays < 7) {
          trend[6 - diffDays] += post.views || 0
        }
      })
      setViewsTrend(trend)

      // 阅读量 Top5
      const sorted = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
      setTopPosts(sorted)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const days = getRecentDays(7)

  const statCards = [
    { title: '总文章数', value: stats.totalPosts, icon: FileText, color: 'blue', sub: `已发布 ${stats.publishedPosts} / 草稿 ${stats.draftPosts}` },
    { title: '总阅读量', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'purple', sub: '所有文章累计' },
    { title: '总点赞数', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'red', sub: '所有文章累计' },
    { title: '近7天发文', value: allPosts.filter(p => {
      const d = new Date(p.createdAt)
      return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
    }).length, icon: TrendingUp, color: 'green', sub: '最近7天新增' },
  ]

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600">欢迎回来！这是您的博客数据概览。</p>
        </div>
        <a
          href="/api/rss"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
          title="RSS 订阅"
        >
          <Rss className="w-4 h-4" />
          RSS 订阅
        </a>
      </div>

      {/* 快速操作 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/posts/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            <Plus className="w-4 h-4 mr-2" />新建文章
          </Link>
          <Link to="/admin/files" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />管理文件
          </Link>
          <Link to="/admin/pages" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Layout className="w-4 h-4 mr-2" />页面设计器
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className="text-2xl font-semibold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 近7天阅读量趋势 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-medium text-gray-900">近7天阅读量分布</h3>
          </div>
          <MiniBarChart data={viewsTrend} color="#3b82f6" />
          <div className="flex justify-between mt-2">
            {days.map((d, i) => (
              <span key={i} className="text-xs text-gray-400">{d}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">* 按文章发布日期统计当日累计阅读量</p>
        </div>

        {/* 阅读量 Top5 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-medium text-gray-900">阅读量 Top 5</h3>
          </div>
          {topPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {topPosts.map((post, i) => {
                const maxViews = topPosts[0]?.views || 1
                const pct = Math.max(4, ((post.views || 0) / maxViews) * 100)
                return (
                  <div key={post._id}>
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        to={`/blog/${post._id}`}
                        className="text-sm text-gray-700 hover:text-primary-600 truncate max-w-[70%]"
                      >
                        <span className="text-gray-400 mr-1.5">#{i + 1}</span>
                        {post.title}
                      </Link>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" />{post.views}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
                <Link to="/admin/posts/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                  <Plus className="w-4 h-4 mr-2" />新建文章
                </Link>
              </div>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div key={post._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link to={`/blog/${post._id}`} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                      {post.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center"><Eye className="w-4 h-4 mr-1" /><span>{post.views}</span></div>
                      <div className="flex items-center"><Heart className="w-4 h-4 mr-1" /><span>{typeof post.likes === 'number' ? post.likes : (post.likes as any)?.length || 0}</span></div>
                      <span className={`px-2 py-1 text-xs rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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