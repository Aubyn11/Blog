// Vercel Serverless Function 入口
// 直接导入纯 Express app（无启动副作用）
import app from '../backend/src/app.js'

export default app