'use client'

import Link from 'next/link'
import { deleteJob } from './actions'

export default function JobOwnerActions({ jobId }: { jobId: string }) {
  async function handleDelete() {
    if (!confirm('이 채용공고를 삭제하시겠습니까?')) return
    await deleteJob(jobId)
  }

  return (
    <div className="flex gap-2">
      <Link
        href={`/post/edit/${jobId}`}
        className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 transition-colors"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </div>
  )
}
