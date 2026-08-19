'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, JobSeekerProfile } from '@/types/database'
import { PageHeader } from '@/components/ui/Form'

const ROLE_LABEL: Record<string, string> = { job_seeker: '구직자', employer: '기업', admin: '관리자' }

type UserWithSeeker = Profile & { seeker?: JobSeekerProfile | null }

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'job_seeker' | 'employer' | 'admin'>('all')
  const [selected, setSelected] = useState<UserWithSeeker | null>(null)
  const [seekerLoading, setSeekerLoading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateRole = async (id: string, role: string) => {
    setUpdating(id)
    await supabase.from('profiles').update({ role }).eq('id', id)
    await load()
    setUpdating(null)
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, role: role as Profile['role'] } : null)
  }

  const openDetail = async (user: Profile) => {
    setSelected(user)
    setResumeUrl(null)
    if (user.role === 'job_seeker') {
      setSeekerLoading(true)
      const { data } = await supabase.from('job_seeker_profiles').select('*').eq('id', user.id).single()
      const seeker = data as JobSeekerProfile | null
      setSelected({ ...user, seeker })
      if (seeker?.resume_file_path) {
        const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(seeker.resume_file_path)
        setResumeUrl(urlData.publicUrl)
      }
      setSeekerLoading(false)
    }
  }

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
    return matchRole && matchSearch
  })

  return (
    <div className="container">
      <PageHeader
        index="Admin / Users"
        title="Members."
        description={`전체 ${users.length}명 · 필터 적용 ${filtered.length}명.`}
      />

      <div className="mt-14 grid grid-cols-[1fr_400px] items-start gap-x-14 gap-y-14 fold-980">
        {/* 목록 */}
        <div className="min-w-0">
          {/* 검색 + 필터 */}
          <div className="flex flex-wrap items-end gap-6">
            <div className="min-w-[240px] flex-1">
              <label htmlFor="u-search" className="form-label">
                Search
              </label>
              <input
                id="u-search"
                type="text"
                placeholder="이름, 이메일, 전화번호"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="field"
              />
            </div>
            <div className="flex flex-wrap gap-2 pb-2">
              {(['all', 'job_seeker', 'employer', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`chip${roleFilter === r ? ' chip-active' : ''}`}
                >
                  {r === 'all' ? '전체' : ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="label-sm mt-12">Loading…</p>
          ) : (
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="table-head">
                    <th className="py-4 font-semibold">Name</th>
                    <th className="py-4 font-semibold">Email</th>
                    <th className="py-4 font-semibold">Phone</th>
                    <th className="py-4 font-semibold">Role</th>
                    <th className="py-4 font-semibold">Joined</th>
                    <th className="py-4 text-right font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr
                      key={user.id}
                      onClick={() => openDetail(user)}
                      className={`cursor-pointer border-b border-line transition-colors ${
                        selected?.id === user.id ? 'bg-bg-strong' : 'hover:bg-bg-strong'
                      }`}
                    >
                      <td className="py-4 pr-4 text-[0.98rem] font-medium text-ink">
                        {user.full_name || '—'}
                      </td>
                      <td className="body-sm py-4 pr-4 text-[0.85rem]">{user.email}</td>
                      <td className="body-sm py-4 pr-4 text-[0.85rem]">{user.phone || '—'}</td>
                      <td className="py-4 pr-4">
                        <span className={`tag${user.role === 'admin' ? ' tag-solid' : ''}`}>
                          {ROLE_LABEL[user.role] || user.role}
                        </span>
                      </td>
                      <td className="num py-4 pr-4">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-4 text-right" onClick={e => e.stopPropagation()}>
                        <select
                          value={user.role}
                          disabled={updating === user.id}
                          onChange={e => updateRole(user.id, e.target.value)}
                          aria-label="역할 변경"
                          className="field-box w-auto py-1.5 text-xs"
                        >
                          <option value="job_seeker">구직자</option>
                          <option value="employer">기업</option>
                          <option value="admin">관리자</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="body border-t border-line py-16">해당 회원이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 상세 패널 */}
        {selected && (
          <aside className="sticky top-[140px] max-h-[calc(100vh-11rem)] overflow-auto border-t border-line-strong pt-6">
            <div className="flex items-center justify-between gap-4 pb-6">
              <p className="label-sm">회원 상세</p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="닫기"
                className="btn-text text-base"
              >
                ×
              </button>
            </div>

            <div className="space-y-10">
              {/* 기본 정보 */}
              <div>
                <p className="h3">{selected.full_name || '이름 없음'}</p>
                <p className="mt-4">
                  <span className={`tag${selected.role === 'admin' ? ' tag-solid' : ''}`}>
                    {ROLE_LABEL[selected.role]}
                  </span>
                </p>

                <dl className="mt-8 border-t border-line-strong">
                  <DetailRow label="이메일" value={selected.email || '—'} />
                  <DetailRow label="전화" value={selected.phone || '—'} />
                  <DetailRow
                    label="가입일"
                    value={new Date(selected.created_at).toLocaleDateString('ko-KR')}
                  />
                  <DetailRow label="카카오" value={selected.kakao_connected ? '연동됨' : '미연동'} />
                  <DetailRow
                    label="추천공개"
                    value={selected.open_to_recommendation ? '동의' : '비동의'}
                  />
                </dl>
              </div>

              {/* 연락 */}
              <div className="flex flex-wrap gap-3">
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="btn btn-sm">
                    이메일
                  </a>
                )}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="btn btn-ghost btn-sm">
                    전화
                  </a>
                )}
              </div>

              {/* 구직자 프로필 */}
              {selected.role === 'job_seeker' && (
                <div>
                  <p className="label-sm border-b border-line-strong pb-4">구직자 프로필</p>
                  {seekerLoading ? (
                    <p className="label-sm mt-6">Loading…</p>
                  ) : selected.seeker ? (
                    <div className="mt-2">
                      {selected.seeker.headline && (
                        <p className="body-sm border-b border-line py-4">{selected.seeker.headline}</p>
                      )}
                      <dl>
                        {selected.seeker.current_title && (
                          <DetailRow label="직함" value={selected.seeker.current_title} />
                        )}
                        {selected.seeker.current_company && (
                          <DetailRow label="현 직장" value={selected.seeker.current_company} />
                        )}
                        {selected.seeker.years_experience != null && (
                          <DetailRow label="경력" value={`${selected.seeker.years_experience}년`} />
                        )}
                        {selected.seeker.location && (
                          <DetailRow label="위치" value={selected.seeker.location} />
                        )}
                      </dl>

                      {selected.seeker.main_specializations?.length > 0 && (
                        <div className="border-b border-line py-4">
                          <p className="label-sm">전문분야</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {selected.seeker.main_specializations.map(s => (
                              <span key={s} className="tag">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selected.seeker.qualifications?.length > 0 && (
                        <div className="border-b border-line py-4">
                          <p className="label-sm">자격증</p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {selected.seeker.qualifications.map(q => (
                              <span key={q} className="tag">
                                {q}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 flex flex-wrap gap-3">
                        {selected.seeker.linkedin_url && (
                          <a
                            href={selected.seeker.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            LinkedIn
                          </a>
                        )}
                        {resumeUrl && (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                          >
                            이력서 다운로드
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="body-sm mt-6">프로필을 등록하지 않았습니다.</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
      <dt className="label-sm">{label}</dt>
      <dd className="break-all text-right text-[0.94rem] text-ink">{value}</dd>
    </div>
  )
}
