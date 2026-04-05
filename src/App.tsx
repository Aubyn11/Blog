import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import UserHome from './pages/UserHome/UserHome'
import Blog from './pages/Blog/Blog'
import Admin from './pages/Admin/Admin'
import Auth from './pages/Auth/Auth'
import PageView from './pages/PageView/PageView'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { I18nProvider } from './contexts/I18nContext'

// 全局错误边界，防止子组件崩溃导致整个应用白屏
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('应用发生错误:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">页面出现错误</h2>
            <p className="text-gray-500 mb-6">{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
          <Router>
          <Routes>
            {/* 后台管理：独立布局，无公共 Header/Footer */}
            <Route path="/admin/*" element={<Admin />} />

            {/* 认证页面：独立布局 */}
            <Route path="/auth/*" element={<Auth />} />

            {/* 访客前台：公共 Layout（Header + Footer） */}
            <Route
              path="/*"
              element={
                <div className="min-h-screen bg-gray-50">
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/u/:userId" element={<UserHome />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<Blog />} />
                      <Route path="/page/:slug" element={<PageView />} />
                    </Routes>
                  </Layout>
                </div>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </I18nProvider>
    </ErrorBoundary>
  )
}

export default App