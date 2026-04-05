// Vercel Serverless Function 入口 - 诊断版
let app = null
let loadError = null

try {
  const mod = await import('../backend/src/app.js')
  app = mod.default
} catch (err) {
  loadError = err
}

export default function handler(req, res) {
  if (loadError) {
    // 把真实错误信息返回，方便排查
    return res.status(500).json({
      error: 'app.js 加载失败',
      message: loadError.message,
      stack: loadError.stack,
    })
  }
  return app(req, res)
}