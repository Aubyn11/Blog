import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: [500, '文件描述不能超过500个字符'],
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // 视频时长
    format: String
  }
}, {
  timestamps: true
})

// 索引优化
fileSchema.index({ uploadedBy: 1, createdAt: -1 })
fileSchema.index({ mimetype: 1 })
fileSchema.index({ isPublic: 1 })

// 虚拟字段：文件类型分类
fileSchema.virtual('fileType').get(function() {
  if (this.mimetype.startsWith('image/')) return 'image'
  if (this.mimetype.startsWith('video/')) return 'video'
  if (this.mimetype.startsWith('audio/')) return 'audio'
  if (this.mimetype.includes('pdf')) return 'pdf'
  if (this.mimetype.includes('word') || this.mimetype.includes('document')) return 'document'
  return 'other'
})

// 静态方法：按类型获取文件
fileSchema.statics.getByType = function(userId, fileType, options = {}) {
  const { page = 1, limit = 20 } = options
  
  const query = { uploadedBy: userId }
  
  switch (fileType) {
    case 'image':
      query.mimetype = { $regex: '^image/' }
      break
    case 'video':
      query.mimetype = { $regex: '^video/' }
      break
    case 'audio':
      query.mimetype = { $regex: '^audio/' }
      break
    case 'pdf':
      query.mimetype = { $regex: 'pdf' }
      break
    case 'document':
      query.mimetype = { $regex: 'word|document' }
      break
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
}

export default mongoose.model('File', fileSchema)