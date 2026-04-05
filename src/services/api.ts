import axios from 'axios'
import { 
  User, 
  Post, 
  File, 
  Page,
  HomeConfig,
  LoginData, 
  RegisterData, 
  CreatePostData,
  CreatePageData,
  PaginatedResponse,
  PaginationParams 
} from '../types'

// 生产环境使用 VITE_API_URL 环境变量，本地开发使用相对路径（vite proxy 会转发到 localhost:5000）
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳避免缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 认证失败，清除token
      // 注意：不使用 window.location.href 强制跳转，避免破坏 React 应用状态导致白屏
      // 由各组件或 AuthContext 自行处理未认证的跳转逻辑
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } else if (error.response?.status === 429) {
      // 速率限制错误
      console.warn('API请求过于频繁，请稍后再试')
    }
    
    return Promise.reject(error)
  }
)

// 设置认证token
export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

// 清除认证信息
export const clearAuth = () => {
  delete api.defaults.headers.common['Authorization']
  localStorage.removeItem('token')
}

// 将后端 GitHub 存储的文章格式适配为前端 Post 类型
const adaptPost = (post: any): Post => ({
  _id: post.id || post._id,
  title: post.title,
  content: post.content,
  excerpt: post.excerpt || '',
  coverImage: post.coverImage || post.featuredImage,
  tags: post.tags || [],
  author: typeof post.author === 'object'
    ? post.author
    : { _id: post.author, username: post.authorName || post.author, email: '', role: 'user', createdAt: '', updatedAt: '' },
  status: post.status,
  views: post.views || 0,
  likes: post.likes || 0,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt
})

// 将后端用户数据适配为前端 User 类型（id -> _id）
const adaptUser = (user: any): User => ({
  ...user,
  _id: user._id || user.id,
})

export const authService = {
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login', data)
    const result = response.data.data
    return { ...result, user: adaptUser(result.user) }
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register', data)
    const result = response.data.data
    return { ...result, user: adaptUser(result.user) }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    return adaptUser(response.data.data)
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  }
}

export const postService = {
  async getPosts(params: PaginationParams & { search?: string; tag?: string }): Promise<PaginatedResponse<Post>> {
    const response = await api.get('/posts', { params })
    const res = response.data
    // 后端返回 { success, data: [], pagination: { totalItems } }
    // 统一映射为前端期望的 { data: [], total: 0 }
    return {
      data: (res.data || []).map(adaptPost),
      total: res.pagination?.totalItems ?? res.total ?? 0,
      page: res.pagination?.currentPage ?? 1,
      limit: params.limit ?? 10,
      totalPages: res.pagination?.totalPages ?? 1
    }
  },

  async getPost(id: string): Promise<Post> {
    const response = await api.get(`/posts/${id}`)
    return adaptPost(response.data.data)
  },

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await api.post('/posts', data)
    return adaptPost(response.data.data)
  },

  async updatePost(id: string, data: Partial<CreatePostData>): Promise<Post> {
    const response = await api.put(`/posts/${id}`, data)
    return adaptPost(response.data.data)
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/posts/${id}`)
  },

  async likePost(id: string): Promise<Post> {
    const response = await api.post(`/posts/${id}/like`)
    return response.data.data
  }
}

export const fileService = {
  async uploadFile(file: File): Promise<File> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

  async getFiles(params: PaginationParams): Promise<PaginatedResponse<File>> {
    const response = await api.get('/files', { params })
    const res = response.data
    const files = (res.data || []).map((f: any) => ({ ...f, _id: f.id || f._id }))
    return {
      data: files,
      total: res.pagination?.totalItems ?? res.total ?? files.length,
      page: res.pagination?.currentPage ?? 1,
      limit: params.limit ?? 10,
      totalPages: res.pagination?.totalPages ?? 1
    }
  },

  async deleteFile(id: string): Promise<void> {
    await api.delete(`/files/${id}`)
  }
}

// 将后端页面数据适配为前端 Page 类型
const adaptPage = (p: any): Page => ({
  _id: p.id || p._id,
  title: p.title,
  slug: p.slug,
  description: p.description || '',
  components: p.components || [],
  status: p.status,
  author: p.author,
  authorName: p.authorName,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt
})

export const pageService = {
  async getPages(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Page>> {
    const response = await api.get('/pages', { params })
    const res = response.data
    return {
      data: (res.data || []).map(adaptPage),
      total: res.pagination?.totalItems ?? 0,
      page: res.pagination?.currentPage ?? 1,
      limit: params?.limit ?? 20,
      totalPages: res.pagination?.totalPages ?? 1
    }
  },

  async getPage(id: string): Promise<Page> {
    const response = await api.get(`/pages/${id}`)
    return adaptPage(response.data.data)
  },

  async getPageBySlug(slug: string): Promise<Page> {
    const response = await api.get(`/pages/slug/${slug}`)
    return adaptPage(response.data.data)
  },

  async createPage(data: CreatePageData): Promise<Page> {
    const response = await api.post('/pages', data)
    return adaptPage(response.data.data)
  },

  async updatePage(id: string, data: Partial<CreatePageData>): Promise<Page> {
    const response = await api.put(`/pages/${id}`, data)
    return adaptPage(response.data.data)
  },

  async deletePage(id: string): Promise<void> {
    await api.delete(`/pages/${id}`)
  }
}

export const homeConfigService = {
  async getHomeConfig(userId?: string): Promise<HomeConfig | null> {
    const params = userId ? { userId } : {}
    const response = await api.get('/home-config', { params })
    return response.data.data
  },

  async saveHomeConfig(config: HomeConfig): Promise<HomeConfig> {
    const response = await api.put('/home-config', config)
    return response.data.data
  }
}

export default api