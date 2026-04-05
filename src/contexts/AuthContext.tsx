import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, AuthState, LoginData, RegisterData } from '../types'
import { authService, setAuthToken } from '../services/api'

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const user = await authService.getCurrentUser()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          })
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({ type: 'AUTH_FAILURE' })
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE' })
      }
    }

    checkAuth()
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