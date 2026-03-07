'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, JobSeekerProfile } from '@/types/database'

const ROLE_LABEL: Record<string, string> = { job_seeker: '구직자', employer: '기업', admin: '관리자' }
const ROLE_STYLE: Record<string, string> = {
  job_seeker: 'bg-green-100 text-green-700',
  employer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

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
    <div className="flex h-full">
      {/* 목록 */}
      <div className={`flex-1 p-8 overflow-auto ${selected ? 'max-w-[calc(100%-400px)]' : ''}`}>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">회원 관리</h1>
        <p className="text-gray-500 text-sm mb-6">전체 {users.length}명 · 필터 {filtered.length}명</p>

        {/* 검색 + 필터 */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          <div className="flex gap-1">
            {(['all', 'job_seeker', 'employer', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  roleFilter === r ? 'bg-[#2563EB] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {r === 'all' ? '전체' : ROLE_LABEL[r]}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">전화</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">역할</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">가입일</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">역할 변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => openDetail(user)}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${selected?.id === user.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={user.role}
                        disabled={updating === user.id}
                        onChange={e => updateRole(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
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
              <div className="text-center py-12 text-gray-400 text-sm">해당 회원이 없습니다.</div>
            )}
          </div>
        )}
      </div>

      {/* 상세 패널 */}
      {selected && (
        <div className="w-[400px] border-l border-gray-200 bg-white overflow-auto shrink-0">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">회원 상세</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0B1F3A] flex items-center justify-center text-white font-bold text-lg">
                  {(selected.full_name || selected.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selected.full_name || '이름 없음'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[selected.role]}`}>
                    {ROLE_LABEL[selected.role]}
                  </span>
                </div>
              </div>

              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16 shrink-0">이메일</dt>
                  <dd className="text-gray-800 break-all">{selected.email || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16 shrink-0">전화</dt>
                  <dd className="text-gray-800">{selected.phone || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16 shrink-0">가입일</dt>
                  <dd className="text-gray-800">{new Date(selected.created_at).toLocaleDateString('ko-KR')}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16 shrink-0">카카오</dt>
                  <dd className={selected.kakao_connected ? 'text-green-600' : 'text-gray-400'}>
                    {selected.kakao_connected ? '연동됨' : '미연동'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-16 shrink-0">추천공개</dt>
                  <dd className={selected.open_to_recommendation ? 'text-green-600' : 'text-gray-400'}>
                    {selected.open_to_recommendation ? '동의' : '비동의'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 연락 버튼 */}
            <div className="flex gap-2">
              {selected.email && (
                <a
                  href={`mailto:${selected.email}`}
                  className="flex-1 py-2 text-center text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  이메일 연락
                </a>
              )}
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="flex-1 py-2 text-center text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  전화 연락
                </a>
              )}
            </div>

            {/* 구직자 프로필 */}
            {selected.role === 'job_seeker' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">구직자 프로필</h3>
                {seekerLoading ? (
                  <p className="text-sm text-gray-400">불러오는 중...</p>
                ) : selected.seeker ? (
                  <dl className="space-y-2 text-sm">
                    {selected.seeker.headline && (
                      <div><dt className="text-gray-500 text-xs mb-0.5">한줄 소개</dt><dd className="text-gray-800">{selected.seeker.headline}</dd></div>
                    )}
                    {selected.seeker.current_title && (
                      <div className="flex gap-2"><dt className="text-gray-500 w-16 shrink-0">직함</dt><dd className="text-gray-800">{selected.seeker.current_title}</dd></div>
                    )}
                    {selected.seeker.current_company && (
                      <div className="flex gap-2"><dt className="text-gray-500 w-16 shrink-0">현 직장</dt><dd className="text-gray-800">{selected.seeker.current_company}</dd></div>
                    )}
                    {selected.seeker.years_experience != null && (
                      <div className="flex gap-2"><dt className="text-gray-500 w-16 shrink-0">경력</dt><dd className="text-gray-800">{selected.seeker.years_experience}년</dd></div>
                    )}
                    {selected.seeker.location && (
                      <div className="flex gap-2"><dt className="text-gray-500 w-16 shrink-0">위치</dt><dd className="text-gray-800">{selected.seeker.location}</dd></div>
                    )}
                    {selected.seeker.main_specializations?.length > 0 && (
                      <div>
                        <dt className="text-gray-500 text-xs mb-1">전문분야</dt>
                        <dd className="flex flex-wrap gap-1">
                          {selected.seeker.main_specializations.map(s => (
                            <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {selected.seeker.qualifications?.length > 0 && (
                      <div>
                        <dt className="text-gray-500 text-xs mb-1">자격증</dt>
                        <dd className="flex flex-wrap gap-1">
                          {selected.seeker.qualifications.map(q => (
                            <span key={q} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{q}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {selected.seeker.linkedin_url && (
                      <div className="flex gap-2">
                        <dt className="text-gray-500 w-16 shrink-0">LinkedIn</dt>
                        <dd><a href={selected.seeker.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline text-xs">프로필 보기</a></dd>
                      </div>
                    )}
                    {resumeUrl && (
                      <div className="pt-2">
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 text-center text-sm font-medium border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors block"
                        >
                          이력서 다운로드 ({selected.seeker.resume_file_name})
                        </a>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-400">프로필을 등록하지 않았습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
