'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ResumeUploaderProps {
  userId: string
  currentFileName: string | null
  currentFilePath: string | null
  onUpload: (filePath: string, fileName: string) => void
  onRemove: () => void
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function ResumeUploader({
  userId,
  currentFileName,
  currentFilePath,
  onUpload,
  onRemove,
}: ResumeUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setError('')

    // Validate type in app code — Supabase storage also enforces MIME on bucket level
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('PDF, DOC, DOCX 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    setUploading(true)

    // Remove previous file first
    if (currentFilePath) {
      await supabase.storage.from('resumes').remove([currentFilePath])
    }

    const ext = file.name.split('.').pop() ?? 'pdf'
    const filePath = `${userId}/resume_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setUploading(false)
      return
    }

    onUpload(filePath, file.name)
    setUploading(false)
  }

  const handleRemove = async () => {
    if (!currentFilePath) return
    setUploading(true)
    await supabase.storage.from('resumes').remove([currentFilePath])
    onRemove()
    setUploading(false)
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          // reset so same file can be re-selected after removal
          e.target.value = ''
        }}
      />

      {currentFileName ? (
        <div className="flex items-center justify-between gap-6 border border-line-strong px-5 py-4">
          <div className="min-w-0">
            <p className="label-sm">Uploaded</p>
            <p className="mt-1.5 truncate text-[0.98rem] text-ink">{currentFileName}</p>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-text"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="btn-text"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-line-strong px-6 py-10 text-left transition-colors hover:border-ink disabled:opacity-50"
        >
          <p className="label-sm">Resume</p>
          <p className="h4 mt-3">{uploading ? '업로드 중' : '이력서 파일 업로드'}</p>
          <p className="body-sm mt-2 text-[0.85rem]">PDF, DOC, DOCX · 최대 10MB</p>
        </button>
      )}

      {error && <p className="notice-quiet mt-4">{error}</p>}
    </div>
  )
}
