import React, { useState, useRef } from 'react'
import { Download, Upload, FileText, FileJson, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

interface ImportResult {
  title: string
  success: boolean
  error?: string
  id?: string
}

const ImportExport: React.FC = () => {
  const { token } = useAuth()
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null)
  const [importMessage, setImportMessage] = useState('')
  const mdInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  // ==================== 导出 ====================
  const handleExport = async (format: 'markdown' | 'json') => {
    try {
      const res = await fetch(`/api/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('导出失败')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blog-export-${Date.now()}.${format === 'markdown' ? 'zip' : 'json'}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`导出成功（${format.toUpperCase()}）`)
    } catch {
      toast.error('导出失败，请重试')
    }
  }

  // ==================== 导入 ====================
  const handleImport = async (file: File, type: 'markdown' | 'json') => {
    setImporting(true)
    setImportResults(null)
    setImportMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/import/${type}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || '导入失败')

      setImportMessage(data.message || '导入成功')
      if (data.data?.results) {
        setImportResults(data.data.results)
      }
      toast.success(data.message || '导入成功')
    } catch (err: any) {
      toast.error(err.message || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">导入 / 导出</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">批量管理文章数据，支持 Markdown 和 JSON 格式</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 导出区域 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">导出文章</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">将所有已发布文章导出为本地文件，方便备份或迁移。</p>

          <div className="space-y-3">
            {/* Markdown ZIP */}
            <button
              onClick={() => handleExport('markdown')}
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">导出为 Markdown ZIP</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">每篇文章生成独立 .md 文件，含 Front Matter</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>

            {/* JSON */}
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <FileJson className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">导出为 JSON</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">结构化数据，适合程序处理或重新导入</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          </div>
        </div>

        {/* 导入区域 */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">导入文章</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">从本地文件导入文章，导入后默认保存为草稿。</p>

          <div className="space-y-3">
            {/* 导入 Markdown */}
            <div
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer group"
              onClick={() => mdInputRef.current?.click()}
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">导入 Markdown 文件</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">支持 .md / .markdown，可含 Front Matter</p>
              </div>
              <Upload className="w-4 h-4 text-gray-400" />
              <input
                ref={mdInputRef}
                type="file"
                accept=".md,.markdown"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f, 'markdown'); e.target.value = '' }}
              />
            </div>

            {/* 导入 JSON */}
            <div
              className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors cursor-pointer group"
              onClick={() => jsonInputRef.current?.click()}
            >
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <FileJson className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">导入 JSON 文件</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">支持本系统导出的 JSON 格式，可批量导入</p>
              </div>
              <Upload className="w-4 h-4 text-gray-400" />
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f, 'json'); e.target.value = '' }}
              />
            </div>
          </div>

          {/* 导入中 */}
          {importing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              正在导入，请稍候...
            </div>
          )}
        </div>
      </div>

      {/* 导入结果 */}
      {importMessage && (
        <div className="card p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">导入结果</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{importMessage}</p>
          {importResults && importResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {importResults.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded ${r.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  {r.success
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  }
                  <span className={r.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {r.title}
                    {r.error && <span className="text-xs ml-2 opacity-70">({r.error})</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 格式说明 */}
      <div className="card p-5 mt-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📋 Markdown Front Matter 格式说明</h3>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-4 rounded-lg overflow-x-auto">{`---
title: "文章标题"
date: 2024-01-01T00:00:00.000Z
author: 作者名
tags: ["标签1", "标签2"]
excerpt: "文章摘要（可选）"
coverImage: "封面图片URL（可选）"
---

# 文章正文

这里是 Markdown 内容...`}</pre>
      </div>
    </div>
  )
}

export default ImportExport
