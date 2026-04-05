import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Trash2, File as FileIcon, Image, Download } from 'lucide-react'
import { fileService } from '../../services/api'
import { File as FileType } from '../../types'
import toast from 'react-hot-toast'

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<FileType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fileService.getFiles({ page: 1, limit: 50 })
      setFiles(response.data)
    } catch (error) {
      toast.error('获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    let successCount = 0

    for (const file of acceptedFiles) {
      try {
        await fileService.uploadFile(file as unknown as FileType)
        successCount++
      } catch (error) {
        toast.error(`上传 ${file.name} 失败`)
      }
    }

    if (successCount > 0) {
      toast.success(`成功上传 ${successCount} 个文件`)
      fetchFiles()
    }
    setUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除文件 "${name}" 吗？`)) return

    try {
      await fileService.deleteFile(id)
      toast.success('文件删除成功')
      setFiles(files.filter(f => f._id !== id))
    } catch (error) {
      toast.error('删除文件失败')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (mimetype: string) => mimetype.startsWith('image/')

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">文件管理</h1>
        <p className="text-gray-600">上传和管理您的博客文件</p>
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`card p-8 mb-6 border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
          {uploading ? (
            <p className="text-gray-600">上传中，请稍候...</p>
          ) : isDragActive ? (
            <p className="text-primary-600 font-medium">松开鼠标上传文件</p>
          ) : (
            <>
              <p className="text-gray-600 font-medium mb-1">拖拽文件到此处，或点击选择文件</p>
              <p className="text-gray-400 text-sm">支持图片、PDF、文本文件，单文件最大 10MB</p>
            </>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">文件列表</h3>
          <span className="text-sm text-gray-500">{files.length} 个文件</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-3 text-gray-500">加载中...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center">
            <FileIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无文件，请上传</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map(file => (
              <div key={file._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isImage(file.mimetype) ? (
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} · {file.mimetype} · {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-primary-600 truncate max-w-xs">{file.url}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-500"
                    title="查看/下载"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file._id, file.originalName)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileManager
