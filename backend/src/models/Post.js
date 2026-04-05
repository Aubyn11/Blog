import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '文章标题不能为空'],
    trim: true,
    minlength: [5, '文章标题至少5个字符'],
    maxlength: [200, '文章标题不能超过200个字符']
  },
  content: {
    type: String,
    required: [true, '文章内容不能为空'],
    minlength: [10, '文章内容至少10个字符']
  },
  excerpt: {
    type: String,
    required: [true, '文章摘要不能为空'],
    trim: true,
    maxlength: [300, '文章摘要不能超过300个字符']
  },
  coverImage: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  meta: {
    readTime: {
      type: Number,
      default: 0
    },
    wordCount: {
      type: Number,
      default: 0
    }
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 虚拟字段：点赞数
postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0
})

// 索引优化
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ status: 1, createdAt: -1 })
postSchema.index({ tags: 1 })
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' })

// 生成slug的中间件
postSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)
  }
  
  // 计算阅读时间和字数
  if (this.isModified('content')) {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    this.meta.wordCount = wordCount
    this.meta.readTime = Math.ceil(wordCount / 200) // 假设每分钟阅读200字
  }
  
  next()
})

// 静态方法：搜索文章
postSchema.statics.search = function(query, options = {}) {
  const { page = 1, limit = 10, tag, status = 'published' } = options
  
  const searchQuery = { status }
  
  if (query) {
    searchQuery.$text = { $search: query }
  }
  
  if (tag) {
    searchQuery.tags = tag
  }
  
  return this.find(searchQuery)
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
}

export default mongoose.model('Post', postSchema)