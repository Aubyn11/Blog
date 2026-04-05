import React, { createContext, useContext, useState, useEffect } from 'react'

type Locale = 'zh' | 'en'

// 翻译字典
const translations: Record<Locale, Record<string, string>> = {
  zh: {
    // 通用
    'common.loading': '加载中...',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '创建',
    'common.search': '搜索',
    'common.confirm': '确认',
    'common.back': '返回',
    'common.submit': '提交',
    'common.close': '关闭',
    'common.noData': '暂无数据',
    'common.total': '共',
    'common.items': '条',

    // 导航
    'nav.home': '首页',
    'nav.blog': '博客',
    'nav.about': '关于',
    'nav.login': '登录',
    'nav.logout': '退出',
    'nav.admin': '管理后台',

    // 博客
    'blog.title': '博客文章',
    'blog.searchPlaceholder': '搜索文章...',
    'blog.allTags': '全部标签',
    'blog.views': '阅读',
    'blog.likes': '点赞',
    'blog.comments': '评论',
    'blog.readMore': '阅读全文',
    'blog.publishedAt': '发布于',
    'blog.by': '作者',
    'blog.noPost': '暂无文章',
    'blog.prevPage': '上一页',
    'blog.nextPage': '下一页',
    'blog.like': '点赞',
    'blog.liked': '已点赞',
    'blog.toc': '目录',

    // 评论
    'comment.title': '评论',
    'comment.placeholder': '写下你的评论...',
    'comment.guestName': '昵称（游客）',
    'comment.reply': '回复',
    'comment.delete': '删除',
    'comment.submit': '发表评论',
    'comment.noComment': '暂无评论，来发表第一条吧！',
    'comment.loginToComment': '登录后评论',

    // 管理后台
    'admin.dashboard': '仪表盘',
    'admin.posts': '文章管理',
    'admin.files': '文件管理',
    'admin.pages': '页面设计',
    'admin.series': '文章系列',
    'admin.settings': '主页设置',
    'admin.newPost': '新建文章',
    'admin.import': '导入文章',
    'admin.export': '导出文章',

    // 认证
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.username': '用户名',
    'auth.forgotPassword': '忘记密码？',
    'auth.noAccount': '没有账号？',
    'auth.hasAccount': '已有账号？',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.noData': 'No data',
    'common.total': 'Total',
    'common.items': 'items',

    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',

    // Blog
    'blog.title': 'Blog Posts',
    'blog.searchPlaceholder': 'Search posts...',
    'blog.allTags': 'All Tags',
    'blog.views': 'Views',
    'blog.likes': 'Likes',
    'blog.comments': 'Comments',
    'blog.readMore': 'Read More',
    'blog.publishedAt': 'Published at',
    'blog.by': 'By',
    'blog.noPost': 'No posts yet',
    'blog.prevPage': 'Previous',
    'blog.nextPage': 'Next',
    'blog.like': 'Like',
    'blog.liked': 'Liked',
    'blog.toc': 'Contents',

    // Comments
    'comment.title': 'Comments',
    'comment.placeholder': 'Write a comment...',
    'comment.guestName': 'Nickname (Guest)',
    'comment.reply': 'Reply',
    'comment.delete': 'Delete',
    'comment.submit': 'Post Comment',
    'comment.noComment': 'No comments yet. Be the first!',
    'comment.loginToComment': 'Login to comment',

    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.posts': 'Posts',
    'admin.files': 'Files',
    'admin.pages': 'Pages',
    'admin.series': 'Series',
    'admin.settings': 'Home Settings',
    'admin.newPost': 'New Post',
    'admin.import': 'Import',
    'admin.export': 'Export',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
  }
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale
    if (saved === 'zh' || saved === 'en') return saved
    // 跟随浏览器语言
    return navigator.language.startsWith('zh') ? 'zh' : 'en'
  })

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
  }

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  const t = (key: string, fallback?: string): string => {
    return translations[locale][key] ?? fallback ?? key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}

export default I18nContext
