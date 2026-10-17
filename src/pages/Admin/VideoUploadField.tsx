import React, { useEffect, useRef, useState } from 'react'
import { Upload, X, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadService } from '../../services/api'

/**
 * 视频上传控件
 *
 * 流程：选文件 → 向后端要一个预签名 PUT 地址 → 浏览器直接传到 R2 → 拿到公网 URL。
 * 后端全程不碰文件本体（Vercel 函数有 4.5MB 请求体上限，转发行不通）。
 */
const VideoUploadField: React.FC<{
  props: Record<string, any>
  onChange: (props: Record<string, any>) => void
}> = ({ props: p, onChange }) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [maxMB, setMaxMB] = useState(200)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let alive = true
    uploadService
      .getConfig()
      .then(cfg => {
        if (!alive) return
        setEnabled(cfg.enabled)
        if (cfg.limits?.video) setMaxMB(Math.round(cfg.limits.video / 1024 / 1024))
      })
      .catch(() => alive && setEnabled(false))
    return () => {
      alive = false
    }
  }, [])

  const uploading = progress !== null
  const currentSrc: string = p.src || ''

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 允许重复选择同一个文件
    e.target.value = ''
    if (!file) return

    setError('')

    if (!file.type.startsWith('video/')) {
      setError('请选择视频文件（mp4 / webm / mov）')
      return
    }
    if (file.size > maxMB * 1024 * 1024) {
      setError(`文件 ${(file.size / 1024 / 1024).toFixed(1)}MB，超过 ${maxMB}MB 限制`)
      return
    }

    setProgress(0)
    try {
      const ticket = await uploadService.presign({
        kind: 'video',
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })

      const publicUrl = await uploadService.uploadToR2(ticket, file, pct => setProgress(pct))

      onChange({ ...p, src: publicUrl })
      toast.success('视频上传完成')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '上传失败，请检查 R2 配置与 CORS'
      setError(msg)
      toast.error(msg)
    } finally {
      setProgress(null)
    }
  }

  const clearVideo = () => onChange({ ...p, src: '' })

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">视频</label>

      {currentSrc ? (
        <div className="relative">
          <video
            src={currentSrc}
            controls
            preload="metadata"
            className="w-full max-h-40 rounded border border-gray-200 bg-black"
          />
          <button
            onClick={clearVideo}
            title="移除视频"
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="mt-1 text-[11px] text-gray-400 break-all">{currentSrc}</div>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded p-3 text-center">
          <p className="text-xs text-gray-400">还没有选视频</p>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          disabled={uploading || enabled === false}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? '上传中' : '上传视频'}
        </button>
        <span className="text-[11px] text-gray-400">
          mp4 / webm / mov，≤ {maxMB}MB
        </span>
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{progress}%</div>
        </div>
      )}

      {enabled === false && (
        <p className="mt-2 text-[11px] text-amber-600 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          未配置对象存储，暂时只能手动填视频 URL（见 DEPLOY.md 的 R2 配置一节）
        </p>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-red-500 flex items-start gap-1">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export default VideoUploadField
