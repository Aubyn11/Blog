import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Palette, ArrowRight, LogIn, UserPlus, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            多用户博客平台
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            属于你的
            <span className="text-indigo-600"> 个人博客空间</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            免费创建你的个人博客，记录技术探索、生活感悟与创意想法。<br />
            数据存储在 GitHub，完全由你掌控。
          </p>

          {isAuthenticated && user ? (
            // 已登录：显示进入个人主页和后台的按钮
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={`/u/${user._id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                我的主页
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                进入后台
              </a>
            </div>
          ) : (
            // 未登录：显示注册/登录按钮
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                免费注册
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                登录账号
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">平台特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">专属博客空间</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                每位用户拥有独立的博客空间，文章、页面、文件完全隔离，互不干扰。
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">自定义主页</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                自由配置个人主页的头像、简介、社交链接和主题色，打造专属个人品牌。
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-green-200 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">GitHub 数据存储</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                数据存储在 GitHub 仓库，完全免费、透明可控，随时可以导出迁移。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-indigo-600 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-3">立即开始，免费使用</h2>
            <p className="text-indigo-200 mb-6">注册账号，几分钟内即可拥有你的个人博客</p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              免费注册
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home