export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  console.error('错误详情:', err)

  // Mongoose 错误处理
  if (err.name === 'CastError') {
    const message = '资源未找到'
    error = { message, statusCode: 404 }
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} 已存在`
    error = { message, statusCode: 400 }
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message)
    const message = messages.join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    const message = '无效的令牌'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = '令牌已过期'
    error = { message, statusCode: 401 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}