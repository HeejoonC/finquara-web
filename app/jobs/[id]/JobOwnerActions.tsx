'use client'

import Link from 'next/link'
import { deleteJob } from './actions'

export default function JobOwnerActions({ jobId }: { jobId: string }) {
  async function handleDelete() {
    if (!confirm('이 채용공고를 삭제하시겠습니까?')) return
    await deleteJob(jobId)
  }

  return (
    <div className="flex items-center gap-6">
      <Link href={`/post/edit/${jobId}`} className="label link">
        Edit
      </Link>
      <button type="button" onClick={handleDelete} className="btn-text">
        Delete
      </button>
    </div>
  )
}
