import { fileURLToPath } from 'url'
import path from 'path'
import { createRequire } from 'module'

// ✅ 第一步：加载环境变量（必须最先执行）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') })

// 导入 Express app
import app from '../backend/src/index.js'

// Vercel 环境下执行初始化（initAdmin 等）
const useGitHubStorage = process.env.GITHUB_STORAGE_ENABLED === 'true'
if (useGitHubStorage) {
    try {
        const initAdmin = await import('../backend/src/utils/initAdmin.js')
        await initAdmin.default()
    } catch (error) {
        console.warn('⚠️ 管理员初始化失败，但服务器继续运行:', error.message)
    }
}

// 导出为 Vercel handler
export default app