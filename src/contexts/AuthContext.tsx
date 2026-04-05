import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { User, AuthState, LoginData, RegisterData } from '../types'
import { authService, setAuthToken } from '../services/api'

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

// 解析 JWT payload（不验证签名，仅读取 exp 字段）
const parseJwtExp = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null // 转为毫秒
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 清除自动刷新定时器
  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  // 设置 Token 自动续期：在过期前 5 分钟静默重新验证
  const scheduleTokenRefresh = (token: string) => {
    clearRefreshTimer()
    const exp = parseJwtExp(token)
    if (!exp) return
    const now = Date.now()
    const timeUntilExpiry = exp - now
    const refreshAt = timeUntilExpiry - 5 * 60 * 1000 // 提前5分钟
    if (refreshAt <= 0) return // 已过期或即将过期，不设置
    refreshTimerRef.current = setTimeout(async () => {
      try {
        // 静默重新验证：调用 /auth/me 确认 Token 仍有效
        const user = await authService.getCurrentUser()
        dispatch({ type: 'UPDATE_USER', payload: user })
        // 重新调度（后端若返回新 Token 可在此处理）
        const currentToken = localStorage.getItem('token')
        if (currentToken) scheduleTokenRefresh(currentToken)
      } catch {
        // Token 已失效，登出
        localStorage.removeItem('token')
        dispatch({ type: 'LOGOUT' })
      }
    }, refreshAt)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        // 检查 Token 是否已过期
        const exp = parseJwtExp(token)
        if (exp && exp < Date.now()) {
          localStorage.removeItem('token')
          dispatch({ type: 'AUTH_FAILURE' })
          return
        }
        try {
          const user = await authService.getCurrentUser()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          })
          // 设置自动续期
          scheduleTokenRefresh(token)
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({ type: 'AUTH_FAILURE' })
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE' })
      }
    }

    checkAuth()

    // 组件卸载时清除定时器
    return () => clearRefreshTimer()
  }, [])

  const login = async (data: LoginData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authService.login(data)
      localStorage.setItem('token', response.token)
      
      // 设置Authorization头
      setAuthToken(response.token)
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response
      })
      // 登录后设置自动续期
      scheduleTokenRefresh(response.token)
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authService.register(data)
      localStorage.setItem('token', response.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: response
      })
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    clearRefreshTimer()
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}