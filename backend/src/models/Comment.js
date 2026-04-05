import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  // 父评论ID（为空则是顶级评论，有值则是回复）
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  // 作者信息（支持游客评论）
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // 游客昵称（未登录时使用）
  guestName: {
    type: String,
    trim: true,
    maxlength: [50, '昵称不能超过50个字符'],
    default: null
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    trim: true,
    minlength: [1, '评论内容不能为空'],
    maxlength: [1000, '评论内容不能超过1000个字符']
  },
  // 点赞数
  likes: {
    type: Number,
    default: 0
  },
  // 状态：approved=已审核, pending=待审核, deleted=已删除
  status: {
    type: String,
    enum: ['approved', 'pending', 'deleted'],
    default: 'approved'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 索引优化
commentSchema.index({ postId: 1, createdAt: 1 })
commentSchema.index({ parentId: 1 })
commentSchema.index({ status: 1 })

export default mongoose.model('Comment', commentSchema)
