import { validationResult } from 'express-validator'
import File from '../models/File.js'
import fs from 'fs/promises'
import path from 'path'

// 上传文件
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      })
    }

    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      description: req.body.description || ''
    })

    await file.save()

    res.status(201).json({
      success: true,
      message: '文件上传成功',
      data: { file }
    })
  } catch (error) {
    console.error('文件上传错误:', error)
    
    // 删除已上传的文件
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (unlinkError) {
        console.error('删除文件错误:', unlinkError)
      }
    }

    res.status(500).json({
      success: false,
      message: '文件上传失败'
    })
  }
}

// 获取文件列表
export const getFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const fileType = req.query.type || ''

    let query = { uploadedBy: req.user._id }

    // 按文件类型筛选
    if (fileType) {
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
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await File.countDocuments(query)

    res.json({
      success: true,
      data: {
        data: files,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取文件列表错误:', error)
    res.status(500).json({
      success: false,
      message: '获取文件列表失败'
    })
  }
}

// 删除文件
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件未找到'
      })
    }

    // 检查权限
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此文件'
      })
    }

    // 删除物理文件
    try {
      const filePath = path.join('uploads', file.filename)
      await fs.unlink(filePath)
    } catch (unlinkError) {
      console.error('删除物理文件错误:', unlinkError)
    }

    // 删除数据库记录
    await File.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: '文件删除成功'
    })
  } catch (error) {
    console.error('删除文件错误:', error)
    res.status(500).json({
      success: false,
      message: '删除文件失败'
    })
  }
}

// 获取文件信息
export const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件未找到'
      })
    }

    // 检查权限
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问此文件'
      })
    }

    res.json({
      success: true,
      data: { file }
    })
  } catch (error) {
    console.error('获取文件信息错误:', error)
    res.status(500).json({
      success: false,
      message: '获取文件信息失败'
    })
  }
}