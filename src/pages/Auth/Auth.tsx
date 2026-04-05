import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import { useAuth } from '../../contexts/AuthContext'

const Auth: React.FC = () => {
  const { isAuthenticated, loading } = useAuth()

  // 等待认证状态初始化，避免 loading 期间误判
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route index element={<Navigate to="login" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default Auth