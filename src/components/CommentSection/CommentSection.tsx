import React, { useState, useEffect } from 'react'
import { MessageCircle, Heart, Trash2, Reply, Send, User, ChevronDown, ChevronUp } from 'lucide-react'
import { Comment, CreateCommentData } from '../../types'
import { commentService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface CommentSectionProps {
  postId: string
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 单条评论组件
interface CommentItemProps {
  comment: Comment
  postId: string
  currentUserId?: string
  isAdmin?: boolean
  onDelete: (commentId: string) => void
  onReply: (comment: Comment) => void
  onLike: (commentId: string) => void
  likedComments: Set<string>
  depth?: number
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  currentUserId,
  isAdmin,
  onDelete,
  onReply,
  onLike,
  likedComments,
  depth = 0
}) => {
  const [showReplies, setShowReplies] = useState(true)
  const isOwner = currentUserId && comment.author?.id === currentUserId
  const canDelete = isOwner || isAdmin
  const liked = likedComments.has(comment.id)

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="flex-shrink-0">
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.authorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
              {!comment.author && (
                <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">游客</span>
              )}
              <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* 操作栏 */}
          <div className="flex items-center gap-4 mt-1.5 px-1">
            <button
              onClick={() => onLike(comment.id)}
              className={`inline-flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
              <span>{comment.likes > 0 ? comment.likes : '点赞'}</span>
            </button>

            {depth === 0 && (
              <button
                onClick={() => onReply(comment)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>回复</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除</span>
              </button>
            )}

            {depth === 0 && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors ml-auto"
              >
                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{comment.replies.length} 条回复</span>
              </button>
            )}
          </div>

          {/* 子回复 */}
          {depth === 0 && showReplies && comment.replies.length > 0 && (
            <div className="border-l-2 border-gray-100 ml-4 mt-2">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  onDelete={onDelete}
                  onReply={onReply}
                  onLike={onLike}
                  likedComments={likedComments}
                  depth={1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 评论输入框组件
interface CommentFormProps {
  postId: string
  replyTo?: Comment | null
  onCancelReply?: () => void
  onSubmit: (comment: Comment) => void
  isLoggedIn: boolean
  username?: string
}

const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  replyTo,
  onCancelReply,
  onSubmit,
  isLoggedIn,
  username
}) => {
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('请输入评论内容')
      return
    }
    if (!isLoggedIn && !guestName.trim()) {
      setError('请输入昵称')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const data: CreateCommentData = {
        content: content.trim(),
        parentId: replyTo?.id,
        guestName: isLoggedIn ? undefined : guestName.trim()
      }
      const newComment = await commentService.createComment(postId, data)
      setContent('')
      setGuestName('')
      onSubmit(newComment)
      if (onCancelReply) onCancelReply()
    } catch (err: any) {
      setError(err.response?.data?.message || '评论发表失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
          <Reply className="w-4 h-4" />
          <span>回复 <strong className="text-gray-700">{replyTo.authorName}</strong></span>
          <button
            type="button"
            onClick={onCancelReply}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
        </div>
      )}

      {!isLoggedIn && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="你的昵称（必填）"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
            {isLoggedIn ? (username?.charAt(0).toUpperCase() || 'U') : <User className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={replyTo ? `回复 ${replyTo.authorName}...` : '写下你的评论...'}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{content.length}/1000</span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? '发送中...' : '发表评论'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// 主评论区组件
const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { state } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  const isLoggedIn = state.isAuthenticated
  const currentUserId = state.user?._id
  const isAdmin = state.user?.role === 'admin'
  const username = state.user?.username

  useEffect(() => {
    fetchComments()
    // 从 localStorage 读取已点赞的评论
    const liked = JSON.parse(localStorage.getItem(`likedComments_${postId}`) || '[]')
    setLikedComments(new Set(liked))
  }, [postId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const data = await commentService.getComments(postId)
      setComments(data)
    } catch (err) {
      console.error('获取评论失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewComment = (newComment: Comment) => {
    if (newComment.parentId) {
      // 是回复，插入到对应父评论的 replies 中
      setComments(prev => prev.map(c =>
        c.id === newComment.parentId
          ? { ...c, replies: [...c.replies, newComment] }
          : c
      ))
    } else {
      // 顶级评论，追加到列表末尾
      setComments(prev => [...prev, { ...newComment, replies: [] }])
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('确定要删除这条评论吗？')) return
    try {
      await commentService.deleteComment(postId, commentId)
      // 从列表中移除（包括子回复）
      setComments(prev =>
        prev
          .filter(c => c.id !== commentId)
          .map(c => ({ ...c, replies: c.replies.filter(r => r.id !== commentId) }))
      )
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败')
    }
  }

  const handleLike = async (commentId: string) => {
    if (likedComments.has(commentId)) return // 已点赞，不重复
    try {
      const result = await commentService.likeComment(postId, commentId)
      // 更新点赞数
      const updateLikes = (list: Comment[]): Comment[] =>
        list.map(c => {
          if (c.id === commentId) return { ...c, likes: result.likes }
          return { ...c, replies: updateLikes(c.replies) }
        })
      setComments(prev => updateLikes(prev))
      // 记录已点赞
      const newLiked = new Set(likedComments).add(commentId)
      setLikedComments(newLiked)
      localStorage.setItem(`likedComments_${postId}`, JSON.stringify([...newLiked]))
    } catch (err) {
      console.error('点赞失败:', err)
    }
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
        <MessageCircle className="w-5 h-5 text-primary-500" />
        评论
        {totalCount > 0 && (
          <span className="text-sm font-normal text-gray-400">（{totalCount} 条）</span>
        )}
      </h2>

      {/* 评论输入框 */}
      <CommentForm
        postId={postId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSubmit={handleNewComment}
        isLoggedIn={isLoggedIn}
        username={username}
      />

      {/* 评论列表 */}
      <div className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-16 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">还没有评论，来发表第一条吧！</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onReply={setReplyTo}
                onLike={handleLike}
                likedComments={likedComments}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default CommentSection
