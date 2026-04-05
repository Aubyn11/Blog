import { fileURLToPath } from 'url'
import path from 'path'
import { createRequire } from 'module'

// ✅ 第一步：加载环境变量（必须在其他业务模块之前）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
require('dotenv').config({ path: path.join(__dirname, '../.env') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

// 导入路由
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import fileRoutes from './routes/files.js'
import userRoutes from './routes/users.js'
import commentRoutes from './routes/comments.js'

// 导入GitHub存储路由（如果启用）
import githubPostRoutes from './routes/githubPosts.js'
import githubUserRoutes from './routes/githubUsers.js'
import githubFileRoutes from './routes/githubFiles.js'
import githubPageRoutes from './routes/githubPages.js'
import githubCommentRoutes from './routes/githubComments.js'
import homeConfigRoutes from './routes/homeConfig.js'
import rssRoutes from './routes/rss.js'
import githubRssRoutes from './routes/githubRss.js'
import seriesRoutes from './routes/series.js'
import importExportRoutes from './routes/importExport.js'

// 导入中间件
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// ✅ dotenv 已在顶部通过 require 加载，此处删除原来的 dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// 检查存储模式
const useGitHubStorage = process.env.GITHUB_STORAGE_ENABLED === 'true'
console.log(`🚀 启动模式: ${useGitHubStorage ? 'GitHub数据存储' : 'MongoDB数据库'}`)

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

// CORS配置 - 支持多个来源（本地开发 + 生产域名）
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD,
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // 允许无 origin 的请求（如 curl、Postman、服务端渲染）
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

// 速率限制
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 200,                  // 全局：每IP最多200次
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '请求过于频繁，请稍后再试' }
})
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10,                   // 认证接口：每IP最多10次（防暴力破解）
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '登录尝试过于频繁，请15分钟后再试' }
})
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1分钟
    max: 60,                   // API接口：每IP每分钟最多60次
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: '请求过于频繁，请稍后再试' }
})
app.use('/api/auth/', authLimiter)
app.use('/api/', apiLimiter)
app.use('/', generalLimiter)

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static('uploads'))

// 路由配置 - 根据存储模式选择路由
if (useGitHubStorage) {
    console.log('📡 使用GitHub存储路由')
    app.use('/api/posts', githubPostRoutes)
    app.use('/api/posts/:postId/comments', githubCommentRoutes)
    app.use('/api/users', githubUserRoutes)
    app.use('/api/files', githubFileRoutes)
    app.use('/api/pages', githubPageRoutes)
    app.use('/api/home-config', homeConfigRoutes)
    // GitHub模式下 /api/auth 也指向 githubUserRoutes（兼容前端调用）
    app.use('/api/auth', githubUserRoutes)
    app.use('/api/rss', githubRssRoutes)
    app.use('/api/series', seriesRoutes)
    app.use('/api', importExportRoutes)
} else {
    console.log('🗄️ 使用MongoDB路由')
    app.use('/api/posts', postRoutes)
    app.use('/api/posts/:postId/comments', commentRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/files', fileRoutes)
    // MongoDB模式下使用原有认证路由
    app.use('/api/auth', authRoutes)
    app.use('/api/rss', rssRoutes)
    app.use('/api/series', seriesRoutes)
    app.use('/api', importExportRoutes)
}

// 健康检查端点
app.get('/api/health', async (req, res) => {
    try {
        let dbStatus = 'unknown'

        if (useGitHubStorage) {
            // GitHub存储健康检查
            const GitHubStorage = (await import('./services/githubStorage.js')).default
            const storage = new GitHubStorage()
            const health = await storage.healthCheck()
            dbStatus = health.status
        } else {
            // MongoDB健康检查
            dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        }

        res.json({
            status: 'OK',
            message: '服务器运行正常',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            storage: {
                mode: useGitHubStorage ? 'github' : 'mongodb',
                status: dbStatus
            }
        })
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: '服务器健康检查失败',
            error: error.message
        })
    }
})

// 诊断接口 - 仅在开发环境可访问
app.get('/api/debug/env', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: '该接口仅在开发环境可用' })
    }
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

// 404处理
app.use(notFound)

// 错误处理
app.use(errorHandler)

// 数据库连接（仅MongoDB模式需要）
const connectDB = async () => {
    if (useGitHubStorage) {
        console.log('✅ GitHub存储模式，跳过MongoDB连接')
        return
    }

    const maxRetries = 5
    const retryDelay = 3000 // 3秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 尝试连接MongoDB (第 ${attempt} 次)...`)

            const options = {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
                retryWrites: true,
                w: 'majority'
            }

            const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', options)
            console.log(`✅ MongoDB连接成功: ${conn.connection.host}`)

            // 监听连接事件
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB连接错误:', err)
            })

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB连接断开，尝试重连...')
            })

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB重新连接成功')
            })

            return

        } catch (error) {
            console.error(`❌ MongoDB连接失败 (第 ${attempt} 次):`, error.message)

            if (attempt === maxRetries) {
                console.error('💀 达到最大重试次数，服务器启动失败')
                console.log('🔍 请检查以下可能的问题:')
                console.log('   1. 数据库服务是否运行')
                console.log('   2. 连接字符串是否正确')
                console.log('   3. 网络连接是否正常')
                console.log('   4. IP地址是否在白名单中')
                process.exit(1)
            }

            console.log(`⏳ ${retryDelay / 1000}秒后重试...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
    }
}

// 启动服务器
const startServer = async () => {
    try {
        // 连接数据库（如果是MongoDB模式）
        await connectDB()

        // 如果是GitHub存储模式，初始化管理员用户
        if (useGitHubStorage) {
            try {
                const initAdmin = await import('./utils/initAdmin.js')
                await initAdmin.default()
            } catch (error) {
                console.warn('⚠️ 管理员初始化失败，但服务器继续启动:', error.message)
            }
        }

        // 启动Express服务器（仅本地开发，Vercel 不执行此处）
        app.listen(PORT, () => {
            console.log(`🚀 服务器运行在端口 ${PORT}`)
            console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
            console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`)
            console.log(`💾 存储模式: ${useGitHubStorage ? 'GitHub数据存储' : 'MongoDB数据库'}`)

            if (useGitHubStorage) {
                console.log('📋 GitHub配置:')
                console.log(`   仓库: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`)
                console.log(`   分支: ${process.env.GITHUB_DATA_BRANCH || 'main'}`)
                console.log('👤 默认管理员账户:')
                console.log('   用户名: admin')
                console.log('   密码: admin123')
                console.log('   ⚠️ 请立即登录并修改默认密码！')
            }
        })
    } catch (error) {
        console.error('❌ 服务器启动失败:', error)
        process.exit(1)
    }
}

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...')
    process.exit(0)
})

// 导出 app 供 Vercel Serverless Function 使用
export { app }

// 仅在非 Vercel 环境且直接运行时启动服务器（本地开发）
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined
const isDirectRun = !isVercel && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) {
    startServer()
}

export default app