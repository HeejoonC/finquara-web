'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, JobSeekerProfile } from '@/types/database'

const EXAM_OPTIONS = ['FM', 'P', 'IFM', 'LTAM', 'STAM', 'SRM', 'PA', 'GIINT', 'GIPC', '기타']

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
  })

  const [seekerProfile, setSeekerProfile] = useState({
    education_level: '',
    major: '',
    school: '',
    graduation_year: '',
    years_experience: '0',
    actuarial_exams_passed: [] as string[],
    skills: '',
    bio: '',
    linkedin_url: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const [{ data: p }, { data: sp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('job_seeker_profiles').select('*').eq('id', user.id).single(),
      ])

      if (p) {
        const prof = p as Profile
        setProfile({ full_name: prof.full_name || '', phone: prof.phone || '' })
      }
      if (sp) {
        const s = sp as JobSeekerProfile
        setSeekerProfile({
          education_level: s.education_level || '',
          major: s.major || '',
          school: s.school || '',
          graduation_year: s.graduation_year?.toString() || '',
          years_experience: s.years_experience?.toString() || '0',
          actuarial_exams_passed: s.actuarial_exams_passed || [],
          skills: s.skills?.join(', ') || '',
          bio: s.bio || '',
          linkedin_url: s.linkedin_url || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const toggleExam = (exam: string) => {
    setSeekerProfile(prev => ({
      ...prev,
      actuarial_exams_passed: prev.actuarial_exams_passed.includes(exam)
        ? prev.actuarial_exams_passed.filter(e => e !== exam)
        : [...prev.actuarial_exams_passed, exam],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setMessage('')

    const [r1, r2] = await Promise.all([
      supabase.from('profiles').update({ ...profile }).eq('id', userId),
      supabase.from('job_seeker_profiles').upsert({
        id: userId,
        ...seekerProfile,
        graduation_year: seekerProfile.graduation_year ? parseInt(seekerProfile.graduation_year) : null,
        years_experience: parseInt(seekerProfile.years_experience) || 0,
        skills: seekerProfile.skills.split(',').map(s => s.trim()).filter(Boolean),
      }),
    ])

    if (r1.error || r2.error) {
      setMessage('저장 중 오류가 발생했습니다.')
    } else {
      setMessage('프로필이 저장되었습니다.')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">내 프로필</h1>
      <p className="text-gray-500 text-sm mb-8">구직 활동에 사용될 정보를 입력해 주세요.</p>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 기본 정보 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">기본 정보</h2>
          <Field label="이름" value={profile.full_name} onChange={v => setProfile(p => ({ ...p, full_name: v }))} />
          <Field label="연락처" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="010-0000-0000" />
        </section>

        {/* 학력 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">학력</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="학교명" value={seekerProfile.school} onChange={v => setSeekerProfile(p => ({ ...p, school: v }))} />
            <Field label="전공" value={seekerProfile.major} onChange={v => setSeekerProfile(p => ({ ...p, major: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="학력 구분"
              value={seekerProfile.education_level}
              onChange={v => setSeekerProfile(p => ({ ...p, education_level: v }))}
              options={['고졸', '전문학사', '학사', '석사', '박사']}
            />
            <Field label="졸업연도" value={seekerProfile.graduation_year} onChange={v => setSeekerProfile(p => ({ ...p, graduation_year: v }))} placeholder="2023" />
          </div>
        </section>

        {/* 경력 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">경력 및 자격</h2>
          <SelectField
            label="경력 연수"
            value={seekerProfile.years_experience}
            onChange={v => setSeekerProfile(p => ({ ...p, years_experience: v }))}
            options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">계리사 시험 합격 과목</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_OPTIONS.map(exam => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => toggleExam(exam)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    seekerProfile.actuarial_exams_passed.includes(exam)
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>
          <Field label="보유 스킬 (쉼표로 구분)" value={seekerProfile.skills} onChange={v => setSeekerProfile(p => ({ ...p, skills: v }))} placeholder="Excel, Python, R, VBA" />
        </section>

        {/* 자기소개 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">자기소개</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자기소개</label>
            <textarea
              value={seekerProfile.bio}
              onChange={e => setSeekerProfile(p => ({ ...p, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              placeholder="간단한 자기소개를 작성해 주세요."
            />
          </div>
          <Field label="LinkedIn URL" value={seekerProfile.linkedin_url} onChange={v => setSeekerProfile(p => ({ ...p, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." />
        </section>

        {message && (
          <p className={`text-sm ${message.includes('오류') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
      />
    </div>
  )
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
      >
        <option value="">선택</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
