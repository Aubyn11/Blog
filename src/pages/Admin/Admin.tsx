import React, { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FolderOpen, Layout, ChevronLeft,
  ChevronRight, LogOut, User, ExternalLink, Menu, Home
} from 'lucide-react'
import Dashboard from './Dashboard'
import PostEditor from './PostEditor'
import PostList from './PostList'
import FileManager from './FileManager'
import PageList from './PageList'
import PageDesigner from './PageDesigner'
import HomeSettings from './HomeSettings'
import { useAuth } from '../../contexts/AuthContext'

// 侧边栏导航项
const NAV_ITEMS = [
  { path: '/admin',              label: '仪表盘',  icon: LayoutDashboard, exact: true },
  { path: '/admin/posts',        label: '文章管理', icon: FileText },
  { path: '/admin/files',        label: '文件管理', icon: FolderOpen },
  { path: '/admin/pages',        label: '页面设计', icon: Layout },
  { path: '/admin/home-settings',label: '主页设置', icon: Home },
]

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-700 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="text-white font-bold text-lg truncate">
            🛠 管理后台
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(path, exact)
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* 底部用户信息 */}
      <div className={`border-t border-gray-700 p-3 flex-shrink-0 space-y-1 ${collapsed ? 'items-center' : ''}`}>
        {/* 访问前台 */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? '访问前台' : undefined}
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>访问前台</span>}
        </a>

        {/* 用户信息 */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 text-gray-400 text-xs">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="truncate">{user?.username}</span>
          </div>
        )}

        {/* 退出登录 */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? '退出登录' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* 侧边栏 - 桌面端 */}
      <aside
        className={`hidden md:flex flex-col bg-gray-800 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}
      >
        <SidebarContent />
      </aside>

      {/* 侧边栏 - 移动端抽屉 */}
      <aside
        className={`fixed left-0 top-0 h-full w-56 bg-gray-800 z-30 flex flex-col md:hidden transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏（移动端） */}
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-gray-800">管理后台</span>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// ==================== Admin 路由入口 ====================
const Admin: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login?redirect=/admin" replace />
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<PostList />} />
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/edit/:id" element={<PostEditor />} />
        <Route path="files" element={<FileManager />} />
        <Route path="pages" element={<PageList />} />
        <Route path="pages/new" element={<PageDesigner />} />
        <Route path="pages/edit/:id" element={<PageDesigner />} />
        <Route path="home-settings" element={<HomeSettings />} />
      </Routes>
    </AdminLayout>
  )
}

export default Admin