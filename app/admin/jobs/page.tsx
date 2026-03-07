'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/types/database'

export default function AdminJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    let query = supabase.from('jobs').select('*').order('created_at', { ascending: false })
    if (filter === 'pending') query = query.eq('is_published', false)
    if (filter === 'published') query = query.eq('is_published', true)
    const { data } = await query
    setJobs((data as Job[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const togglePublish = async (id: string, current: boolean) => {
    setUpdating(id)
    await supabase.from('jobs').update({ is_published: !current }).eq('id', id)
    await load()
    setUpdating(null)
  }

  const deleteJob = async (id: string) => {
    if (!confirm('이 채용공고를 삭제하시겠습니까?')) return
    setUpdating(id)
    await supabase.from('jobs').delete().eq('id', id)
    await load()
    setUpdating(null)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">채용공고 관리</h1>
      <p className="text-gray-500 text-sm mb-6">전체 {jobs.length}건</p>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '전체' },
          { key: 'pending', label: '승인 대기' },
          { key: 'published', label: '게시 중' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#2563EB] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500">불러오는 중...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">공고 제목</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">기업</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">등록일</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium text-gray-800 hover:text-[#2563EB] transition-colors line-clamp-1 max-w-[220px] block"
                    >
                      {job.title}
                    </Link>
                    {job.location && <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>}
                    {(job.main_specializations?.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.main_specializations.slice(0, 2).map(s => (
                          <span key={s} className="text-xs px-1.5 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{job.company}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {job.is_published ? '게시 중' : '대기 중'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(job.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePublish(job.id, job.is_published)}
                        disabled={updating === job.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          job.is_published
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {job.is_published ? '비공개' : '승인'}
                      </button>
                      <button
                        onClick={() => deleteJob(job.id)}
                        disabled={updating === job.id}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-400">채용공고가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  )
}
