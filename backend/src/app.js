import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'

// 导入路由
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import fileRoutes from './routes/files.js'
import userRoutes from './routes/users.js'
import githubPostRoutes from './routes/githubPosts.js'
import githubUserRoutes from './routes/githubUsers.js'
import githubFileRoutes from './routes/githubFiles.js'
import githubPageRoutes from './routes/githubPages.js'
import homeConfigRoutes from './routes/homeConfig.js'

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

const app = express()

// 检查存储模式
const useGitHubStorage = process.env.GITHUB_STORAGE_ENABLED === 'true'

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}))

app.use(compression())

// CORS配置
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD,
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            console.warn(`⚠️ CORS 拒绝来源: ${origin}`)
            callback(new Error(`CORS policy: origin ${origin} not allowed`))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// 路由配置
if (useGitHubStorage) {
    app.use('/api/posts', githubPostRoutes)
    app.use('/api/users', githubUserRoutes)
    app.use('/api/files', githubFileRoutes)
    app.use('/api/pages', githubPageRoutes)
    app.use('/api/home-config', homeConfigRoutes)
    app.use('/api/auth', githubUserRoutes)
} else {
    app.use('/api/posts', postRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/files', fileRoutes)
    app.use('/api/auth', authRoutes)
}

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        let dbStatus = 'unknown'
        if (useGitHubStorage) {
            const GitHubStorage = (await import('./services/githubStorage.js')).default
            const storage = new GitHubStorage()
            const health = await storage.healthCheck()
            dbStatus = health.status
        }
        res.json({
            status: 'OK',
            message: '服务器运行正常',
            timestamp: new Date().toISOString(),
            storage: { mode: useGitHubStorage ? 'github' : 'mongodb', status: dbStatus }
        })
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: error.message })
    }
})

// 诊断接口
app.get('/api/debug/env', (req, res) => {
    res.json({
        GITHUB_STORAGE_ENABLED: process.env.GITHUB_STORAGE_ENABLED || '❌ 未设置',
        GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '✅ 已设置' : '❌ 未设置',
        GITHUB_OWNER: process.env.GITHUB_OWNER || '❌ 未设置',
        GITHUB_REPO: process.env.GITHUB_REPO || '❌ 未设置',
        GITHUB_DATA_BRANCH: process.env.GITHUB_DATA_BRANCH || '❌ 未设置',
        JWT_SECRET: process.env.JWT_SECRET ? '✅ 已设置' : '❌ 未设置',
        FRONTEND_URL: process.env.FRONTEND_URL || '❌ 未设置',
        NODE_ENV: process.env.NODE_ENV || '❌ 未设置',
    })
})

// 404 & 错误处理
app.use(notFound)
app.use(errorHandler)

export default app
