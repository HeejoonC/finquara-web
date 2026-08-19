'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/types/database'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES, EXPERIENCE_LEVELS, EMPLOYMENT_TYPES } from '@/lib/constants/actuary'
import { PageHeader } from '@/components/ui/Form'

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
    <div className="container">
      <PageHeader
        index="Admin / Jobs"
        title="Listings."
        description={`전체 ${jobs.length}건 · 필터 적용 ${filtered.length}건.`}
      />

      <div className="mt-14 flex flex-wrap items-end gap-6">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="j-search" className="form-label">
            Search
          </label>
          <input
            id="j-search"
            type="text"
            placeholder="제목, 기업, 위치"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="field"
          />
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {([
            { key: 'all', label: '전체' },
            { key: 'pending', label: '승인 대기' },
            { key: 'published', label: '게시 중' },
          ] as const).map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`chip${filter === f.key ? ' chip-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="label-sm mt-12">Loading…</p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="table-head">
                <th className="py-4 font-semibold">Title</th>
                <th className="py-4 font-semibold">Company</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold">Created</th>
                <th className="py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id} className="border-b border-line transition-colors hover:bg-bg-strong">
                  <td className="max-w-[280px] py-5 pr-6">
                    <Link href={`/jobs/${job.id}`} target="_blank" className="link h4 block truncate text-[1rem]">
                      {job.title}
                    </Link>
                    {job.location && <p className="body-sm mt-1 text-[0.82rem]">{job.location}</p>}
                    {job.main_specializations?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.main_specializations.slice(0, 2).map(s => (
                          <span key={s} className="tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="body-sm py-5 pr-6">{job.company}</td>
                  <td className="py-5 pr-6">
                    <span className={`tag${job.is_published ? '' : ' tag-solid'}`}>
                      {job.is_published ? '게시 중' : '대기 중'}
                    </span>
                  </td>
                  <td className="num py-5 pr-6">
                    {new Date(job.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="py-5">
                    <div className="flex justify-end gap-5">
                      <button type="button" onClick={() => setEditing(job)} className="btn-text">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(job.id, job.is_published)}
                        disabled={updating === job.id}
                        className="btn-text"
                      >
                        {job.is_published ? 'Unpublish' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteJob(job.id)}
                        disabled={updating === job.id}
                        className="btn-text"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="body border-t border-line py-16">채용공고가 없습니다.</p>
          )}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: 'rgba(17,17,17,0.45)' }}
        >
          <div className="panel-float max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-6 border-b border-line bg-bg px-8 py-6">
              <div>
                <p className="label-sm">Edit listing</p>
                <h2 className="h4 mt-2">채용공고 수정</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="닫기"
                className="btn-text text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-8 px-8 py-8">
              <div className="grid grid-cols-2 gap-8 fold-720">
                <ModalField
                  label="공고 제목 *"
                  value={editing.title}
                  onChange={v => setEditing({ ...editing, title: v })}
                />
                <ModalField
                  label="기업명 *"
                  value={editing.company}
                  onChange={v => setEditing({ ...editing, company: v })}
                />
                <ModalField
                  label="근무지"
                  value={editing.location || ''}
                  onChange={v => setEditing({ ...editing, location: v })}
                  placeholder="서울, 부산 등"
                />
                <ModalField
                  label="연봉"
                  value={editing.salary_range || ''}
                  onChange={v => setEditing({ ...editing, salary_range: v })}
                  placeholder="협의 가능"
                />
                <div>
                  <label htmlFor="m-exp" className="form-label">
                    경력
                  </label>
                  <select
                    id="m-exp"
                    value={editing.experience_level || ''}
                    onChange={e => setEditing({ ...editing, experience_level: e.target.value })}
                    className="field"
                  >
                    <option value="">선택</option>
                    {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="m-type" className="form-label">
                    고용형태
                  </label>
                  <select
                    id="m-type"
                    value={editing.employment_type || ''}
                    onChange={e => setEditing({ ...editing, employment_type: e.target.value })}
                    className="field"
                  >
                    <option value="">선택</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <ModalField
                label="지원 URL"
                value={editing.apply_url || ''}
                onChange={v => setEditing({ ...editing, apply_url: v })}
                placeholder="https://..."
              />

              <div>
                <span className="form-label">주요 분야</span>
                <div className="flex flex-wrap gap-2">
                  {MAIN_SPECIALIZATIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, main_specializations: toggleArrayItem(editing.main_specializations || [], s) })}
                      className={`chip${editing.main_specializations?.includes(s) ? ' chip-active' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="form-label">세부 전문분야</span>
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {DETAILED_SPECIALTIES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...editing, detailed_specialties: toggleArrayItem(editing.detailed_specialties || [], s) })}
                      className={`chip${editing.detailed_specialties?.includes(s) ? ' chip-active' : ''}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="m-desc" className="form-label">
                  공고 내용
                </label>
                <textarea
                  id="m-desc"
                  value={editing.description || ''}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                  rows={10}
                  className="field-box"
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap gap-4 border-t border-line bg-bg px-8 py-6">
              <button type="button" onClick={saveEdit} disabled={saving} className="btn">
                {saving ? '저장 중' : '저장'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = `m-${label.replace(/\s+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="field"
      />
    </div>
  )
}
