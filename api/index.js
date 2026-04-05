// Vercel Serverless Function 入口
// 将 Express app 适配为 Vercel serverless handler

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

// 加载环境变量（Vercel 会自动注入环境变量，本地测试时从 backend/.env 加载）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// 尝试加载本地 .env（生产环境 Vercel 会忽略，使用 Dashboard 配置的环境变量）
try {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') })
} catch {
  // dotenv 不存在时忽略（生产环境）
}

// 导入 Express app
import app from '../backend/src/index.js'

// 导出为 Vercel handler
export default app
