import nodemailer from 'nodemailer'

// 创建邮件传输器（懒加载，避免未配置时报错）
let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ 邮件服务未配置（SMTP_HOST/SMTP_USER/SMTP_PASS），邮件通知已禁用')
    return null
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 465,
    secure: parseInt(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false }
  })

  return transporter
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@blog.com'
const SITE_NAME = '个人博客'
const SITE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * 发送新评论通知给文章作者
 */
export const sendNewCommentNotification = async ({ postTitle, postId, commentAuthor, commentContent, authorEmail }) => {
  const t = getTransporter()
  if (!t || !authorEmail) return

  try {
    await t.sendMail({
      from: `"${SITE_NAME}" <${FROM}>`,
      to: authorEmail,
      subject: `📬 您的文章《${postTitle}》收到了新评论`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1f2937;">您有一条新评论</h2>
          <p style="color: #6b7280;">您的文章 <strong>《${postTitle}》</strong> 收到了新评论：</p>
          <blockquote style="border-left: 4px solid #6366f1; padding: 12px 16px; background: #f9fafb; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #374151;"><strong>${commentAuthor}</strong> 说：</p>
            <p style="margin: 8px 0 0; color: #4b5563;">${commentContent}</p>
          </blockquote>
          <a href="${SITE_URL}/blog/${postId}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            查看文章
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            此邮件由 ${SITE_NAME} 自动发送，请勿直接回复。
          </p>
        </div>
      `
    })
    console.log(`✉️ 新评论通知已发送至 ${authorEmail}`)
  } catch (err) {
    console.error('邮件发送失败:', err.message)
  }
}

/**
 * 发送新回复通知给被回复的评论者
 */
export const sendReplyNotification = async ({ postTitle, postId, replyAuthor, replyContent, recipientEmail, recipientName }) => {
  const t = getTransporter()
  if (!t || !recipientEmail) return

  try {
    await t.sendMail({
      from: `"${SITE_NAME}" <${FROM}>`,
      to: recipientEmail,
      subject: `💬 ${replyAuthor} 回复了您的评论`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1f2937;">您的评论收到了回复</h2>
          <p style="color: #6b7280;">Hi ${recipientName}，<strong>${replyAuthor}</strong> 在文章 <strong>《${postTitle}》</strong> 中回复了您：</p>
          <blockquote style="border-left: 4px solid #10b981; padding: 12px 16px; background: #f9fafb; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #4b5563;">${replyContent}</p>
          </blockquote>
          <a href="${SITE_URL}/blog/${postId}" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            查看回复
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            此邮件由 ${SITE_NAME} 自动发送，请勿直接回复。
          </p>
        </div>
      `
    })
    console.log(`✉️ 回复通知已发送至 ${recipientEmail}`)
  } catch (err) {
    console.error('邮件发送失败:', err.message)
  }
}

/**
 * 发送测试邮件（用于验证配置）
 */
export const sendTestEmail = async (toEmail) => {
  const t = getTransporter()
  if (!t) throw new Error('邮件服务未配置')

  await t.sendMail({
    from: `"${SITE_NAME}" <${FROM}>`,
    to: toEmail,
    subject: `✅ ${SITE_NAME} 邮件服务测试`,
    html: `<p>邮件服务配置成功！来自 ${SITE_NAME}。</p>`
  })
}

export default { sendNewCommentNotification, sendReplyNotification, sendTestEmail }
