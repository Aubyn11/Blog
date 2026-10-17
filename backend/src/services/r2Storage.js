import crypto from 'node:crypto'

/**
 * Cloudflare R2 预签名上传服务
 *
 * 为什么是「预签名」而不是「上传到后端再转发」：
 *   Vercel Serverless Function 的请求体上限是 4.5MB，几十 MB 的视频根本传不进来。
 *   所以后端只负责签发一个短时效的 PUT 地址，文件由浏览器直接传到 R2。
 *   带宽和存储费用都落在 R2（出口流量免费），不占 Vercel 额度。
 *
 * AWS SDK 是**动态导入**的：
 *   如果依赖还没装（npm install 未执行），整个 Express 应用不会因此崩溃，
 *   只是上传接口返回 503，其它功能全部正常。
 */

// ── 常量 ──────────────────────────────────────────────
const VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const LIMITS = {
  video: 200 * 1024 * 1024, // 200MB
  image: 10 * 1024 * 1024, // 10MB
}

// 预签名有效期（秒）
const EXPIRES_IN = 900

// ── 配置读取 ──────────────────────────────────────────
export function getConfig() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  }
}

export function isConfigured() {
  const c = getConfig()
  return Boolean(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket && c.publicBaseUrl)
}

// ── 工具函数 ──────────────────────────────────────────
function sanitizeFilename(name) {
  const base = String(name || 'file')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-') // 只留字母数字、下划线、点、横杠
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-80)
  return base || 'file'
}

/** 生成对象键：videos/2026/10/9f3c1a2b-demo.mp4 */
export function buildKey(kind, filename) {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const prefix = kind === 'image' ? 'images' : 'videos'
  const rand = crypto.randomBytes(4).toString('hex')
  return `${prefix}/${yyyy}/${mm}/${rand}-${sanitizeFilename(filename)}`
}

export function publicUrlFor(key) {
  const { publicBaseUrl } = getConfig()
  return `${publicBaseUrl}/${key}`
}

/**
 * 校验上传请求，返回 { ok, ext } 或 { ok:false, message }
 */
export function validateRequest({ kind, contentType, size }) {
  const type = kind === 'image' ? 'image' : 'video'
  const table = type === 'image' ? IMAGE_TYPES : VIDEO_TYPES

  if (!contentType || !table[contentType]) {
    const allowed = Object.keys(table).join('、')
    return { ok: false, message: `不支持的文件类型 ${contentType || '(空)'}，仅支持：${allowed}` }
  }

  if (!size || Number(size) <= 0) {
    return { ok: false, message: '文件大小无效' }
  }

  if (Number(size) > LIMITS[type]) {
    return { ok: false, message: `文件超过 ${Math.round(LIMITS[type] / 1024 / 1024)}MB 限制` }
  }

  return { ok: true, ext: table[contentType] }
}

// ── 预签名 ────────────────────────────────────────────
async function loadSdk() {
  const [s3, presigner] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/s3-request-presigner'),
  ])
  return { ...s3, getSignedUrl: presigner.getSignedUrl }
}

/**
 * 生成直传用的 PUT 地址
 * @returns {Promise<{ uploadUrl: string, key: string, publicUrl: string, expiresIn: number }>}
 */
export async function createUploadTicket({ kind, filename, contentType }) {
  const cfg = getConfig()
  if (!isConfigured()) {
    throw Object.assign(new Error('R2 存储未配置，请先设置 R2_ACCOUNT_ID 等环境变量'), { statusCode: 503 })
  }

  let sdk
  try {
    sdk = await loadSdk()
  } catch {
    throw Object.assign(
      new Error('上传依赖未安装，请在项目根目录执行 npm install'),
      { statusCode: 503 }
    )
  }

  const key = buildKey(kind, filename)

  const client = new sdk.S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  })

  const command = new sdk.PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  })

  // 注意：ContentType 会被算进签名，浏览器 PUT 时必须带一模一样的 Content-Type，
  // 否则 R2 会返回 SignatureDoesNotMatch。
  const uploadUrl = await sdk.getSignedUrl(client, command, { expiresIn: EXPIRES_IN })

  return {
    uploadUrl,
    key,
    publicUrl: publicUrlFor(key),
    expiresIn: EXPIRES_IN,
  }
}

export const limits = LIMITS
export const allowedTypes = { video: Object.keys(VIDEO_TYPES), image: Object.keys(IMAGE_TYPES) }
