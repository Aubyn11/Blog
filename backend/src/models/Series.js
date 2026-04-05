import mongoose from 'mongoose'

const seriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '系列标题不能为空'],
    trim: true,
    maxlength: [100, '系列标题不能超过100个字符']
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '系列描述不能超过500个字符']
  },
  coverImage: {
    type: String,
    default: null
  },
  posts: [{
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    order: { type: Number, default: 0 }
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
  tags: [{ type: String, trim: true }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// 虚拟字段：文章数量
seriesSchema.virtual('postCount').get(function () {
  return this.posts ? this.posts.length : 0
})

// 生成 slug
seriesSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80)
  }
  next()
})

seriesSchema.index({ author: 1, createdAt: -1 })
seriesSchema.index({ status: 1 })

export default mongoose.model('Series', seriesSchema)
