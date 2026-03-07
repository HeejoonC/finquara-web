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
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">📄</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{currentFileName}</p>
              <p className="text-xs text-gray-500">업로드 완료</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-[#2563EB] hover:underline disabled:opacity-50"
            >
              교체
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#2563EB] hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <div className="text-3xl mb-2">📎</div>
          <p className="text-sm font-medium text-gray-700">
            {uploading ? '업로드 중...' : '이력서 파일 업로드'}
          </p>
          <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX · 최대 10MB</p>
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
