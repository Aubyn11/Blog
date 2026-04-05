export interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export interface Post {
  _id: string
  title: string
  content: string
  excerpt: string
  coverImage?: string
  tags: string[]
  author: User
  status: 'published' | 'draft'
  views: number
  likes: number
  createdAt: string
  updatedAt: string
}

export interface File {
  _id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  uploadedBy: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface CreatePostData {
  title: string
  content: string
  excerpt: string
  tags: string[]
  coverImage?: string
  status: 'published' | 'draft'
}

// ========== 评论相关类型 ==========

export interface CommentAuthor {
  id: string
  username: string
  avatar?: string
}

export interface Comment {
  id: string
  postId: string
  parentId: string | null
  content: string
  likes: number
  createdAt: string
  updatedAt: string
  author: CommentAuthor | null
  guestName: string | null
  authorName: string
  replies: Comment[]
}

export interface CreateCommentData {
  content: string
  parentId?: string
  guestName?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ========== 可视化页面设计器相关类型 ==========

/** 组件类型枚举 */
export type ComponentType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'card'
  | 'columns'
  | 'video'
  | 'code'
  | 'quote'
  | 'list'
  | 'background'
  | 'page-card'

/** 单个页面组件 */
export interface PageComponent {
  id: string
  type: ComponentType
  props: Record<string, any>
  children?: PageComponent[]
}

/** 背景配置 */
export interface PageBackground {
  type: 'color' | 'image' | 'gradient'
  color?: string
  imageUrl?: string
  imageLocalData?: string  // base64本地图片
  gradient?: string
  size?: 'cover' | 'contain' | 'auto' | string
  position?: string
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  opacity?: number
  width?: string
  height?: string
}

/** 页面数据结构 */
export interface Page {
  _id: string
  title: string
  slug: string
  description?: string
  components: PageComponent[]
  background?: PageBackground
  status: 'published' | 'draft'
  author: string
  authorName?: string
  createdAt: string
  updatedAt: string
}

/** 创建/更新页面的请求数据 */
export interface CreatePageData {
  title: string
  slug: string
  description?: string
  components: PageComponent[]
  background?: PageBackground
  status: 'published' | 'draft'
}

// ========== 主页配置相关类型 ==========

/** 社交链接 */
export interface SocialLink {
  id: string
  platform: string   // 平台名称，如 GitHub、Twitter、微博
  url: string
  icon?: string      // emoji 或图标标识
}

/** 主页自定义区块 */
export interface HomeSection {
  id: string
  type: 'text' | 'links' | 'custom'
  title?: string
  content?: string   // Markdown 文本
  visible: boolean
}

/** 主页配置 */
export interface HomeConfig {
  // 博主信息
  name: string
  title?: string          // 职位/头衔，如"全栈开发者"
  bio: string             // 简介
  avatarEmoji?: string    // 头像 emoji，如 👤
  avatarUrl?: string      // 头像图片 URL
  avatarLocalData?: string // 头像本地图片 base64

  // 社交链接
  socialLinks: SocialLink[]

  // 按钮
  primaryBtnText?: string
  primaryBtnLink?: string
  secondaryBtnText?: string
  secondaryBtnLink?: string

  // 自定义区块（显示在主页下方）
  sections: HomeSection[]

  // 主题色
  accentColor?: string    // 如 indigo、purple、blue

  updatedAt?: string
}