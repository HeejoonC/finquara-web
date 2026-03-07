'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/types/database'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES, EXPERIENCE_LEVELS, EMPLOYMENT_TYPES } from '@/lib/constants/actuary'

export default function AdminJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editing, setEditing] = useState<Job | null>(null)
  const [saving, setSaving] = useState(false)

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
    setJobs(prev => prev.filter(j => j.id !== id))
    setUpdating(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    await supabase.from('jobs').update({
      title: editing.title,
      company: editing.company,
      location: editing.location,
      experience_level: editing.experience_level,
      employment_type: editing.employment_type,
      salary_range: editing.salary_range,
      description: editing.description,
      apply_url: editing.apply_url,
      main_specializations: editing.main_specializations,
      detailed_specialties: editing.detailed_specialties,
    }).eq('id', editing.id)
    await load()
    setEditing(null)
    setSaving(false)
  }

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    return !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">채용공고 관리</h1>
      <p className="text-gray-500 text-sm mb-6">전체 {jobs.length}건 · 필터 {filtered.length}건</p>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="제목, 기업, 위치 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
        <div className="flex gap-1">
          {([
            { key: 'all', label: '전체' },
            { key: 'pending', label: '승인 대기' },
            { key: 'published', label: '게시 중' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-[#2563EB] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">불러오는 중...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">공고 제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">기업</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">등록일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium text-gray-800 hover:text-[#2563EB] transition-colors line-clamp-1 max-w-[200px] block"
                      target="_blank"
                    >
                      {job.title}
                    </Link>
                    {job.location && <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>}
                    {job.main_specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.main_specializations.slice(0, 2).map(s => (
                          <span key={s} className="text-xs px-1.5 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">{s}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{job.company}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {job.is_published ? '게시 중' : '대기 중'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {new Date(job.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setEditing(job)}
                        className="px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => togglePublish(job.id, job.is_published)}
                        disabled={updating === job.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          job.is_published ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
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
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">채용공고가 없습니다.</div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-800">채용공고 수정</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">공고 제목 *</label>
                  <input
                    value={editing.title}
                    onChange={e => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">기업명 *</label>
                  <input
                    value={editing.company}
                    onChange={e => setEditing({ ...editing, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">근무지</label>
                  <input
                    value={editing.location || ''}
                    onChange={e => setEditing({ ...editing, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="서울, 부산 등"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">연봉</label>
                  <input
                    value={editing.salary_range || ''}
                    onChange={e => setEditing({ ...editing, salary_range: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="협의 가능"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">경력</label>
                  <select
                    value={editing.experience_level || ''}
                    onChange={e => setEditing({ ...editing, experience_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">선택</option>
                    {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">고용형태</label>
                  <select
                    value={editing.employment_type || ''}
                    onChange={e => setEditing({ ...editing, employment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="">선택</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">지원 URL</label>
                <input
                  value={editing.apply_url || ''}
                  onChange={e => setEditing({ ...editing, apply_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">주요 분야</label>
                <div className="flex flex-wrap gap-2">
                  {MAIN_SPECIALIZATIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, main_specializations: toggleArrayItem(editing.main_specializations || [], s) })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        editing.main_specializations?.includes(s)
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">세부 전문분야</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {DETAILED_SPECIALTIES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, detailed_specialties: toggleArrayItem(editing.detailed_specialties || [], s) })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        editing.detailed_specialties?.includes(s)
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">공고 내용</label>
                <textarea
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
