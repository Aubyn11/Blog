// Vercel Serverless Function 入口
// 将 Express app 适配为 Vercel serverless handler

// ⚠️ 注意：ES Module 中 import 语句会被提升，所以 dotenv 必须在 backend/src/index.js 中最先加载
// 此文件只做纯转发，不在这里加载 dotenv（因为 import app 会先于 require 执行）

// 导入 Express app（backend/src/index.js 内部已处理 dotenv 加载）
import app from '../backend/src/index.js'

// 导出为 Vercel handler
export default app