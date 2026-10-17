export const notFound = (req, res, next) => {
  const error = new Error(`未找到 - ${req.originalUrl}`)
  // 必须挂到 error 上：下面 errorHandler 用的是 {...err}，
  // Error 实例的 statusCode 不可枚举，直接写 res.status() 会被覆盖成 500
  error.statusCode = 404
  next(error)
}