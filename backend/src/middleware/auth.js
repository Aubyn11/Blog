import jwt from 'jsonwebtoken'

// JWT认证中间件
export const protect = async (req, res, next) => {
    try {
        let token

        // 从请求头获取token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌，请先登录'
            })
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production')

        // 将用户信息挂载到请求对象
        req.user = decoded

        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '认证令牌无效或已过期'
        })
    }
}

// 可选认证中间件（不强制要求登录，但如果有token则解析）
export const optionalAuth = async (req, res, next) => {
    try {
        let token

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production')
            req.user = decoded
        }
    } catch (error) {
        // token无效时忽略，继续作为未认证用户处理
    }

    next()
}

// 角色权限中间件
export const authorize = (role) => {
    return (req, res, next) => {
        // 检查用户是否已认证
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '用户未认证'
            })
        }

        // 检查用户角色权限
        if (req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `权限不足，需要 ${role} 角色`
            })
        }

        next()
    }
}