'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MultiSelectChips from '@/components/ui/MultiSelectChips'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import ResumeUploader from '@/components/ui/ResumeUploader'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

const QUALIFICATIONS = ['FIAK', 'ASA', 'FSA', '한국 일부합격', '미국 일부합격']

const KOREA_PARTIAL_SUBJECTS = [
  '보험법 / 보험계약 관련',
  '경제학',
  '보험수학',
  '회계원리',
  '영어 대체 이수',
  '계리리스크관리',
  '보험수학 II / 준비금 관련 과목',
  '연금계리수학',
  '계리모델링',
  '재무관리',
  '금융공학',
]

const US_PARTIAL_SUBJECTS = [
  'Exam P',
  'Exam FM',
  'FAM',
  'ALTAM',
  'ASTAM',
  'SRM',
  'PA',
  'ATPA',
  'VEE Economics',
  'VEE Accounting and Finance',
  'VEE Mathematical Statistics',
  '기타 SOA 시험 / 모듈',
]

// ─── State types ───────────────────────────────────────────────────────────────

interface ProfileState {
  full_name: string
  phone: string
  open_to_recommendation: boolean
  receive_job_mailing: boolean
}

interface SeekerState {
  headline: string
  years_experience: string
  current_company: string
  current_title: string
  location: string
  main_specializations: string[]
  detailed_specialties: string[]
  specialty_etc: string
  qualifications: string[]
  korea_partial_pass_subjects: string[]
  us_partial_pass_subjects: string[]
  us_partial_pass_etc: string
  bio: string
  linkedin_url: string
  resume_file_path: string | null
  resume_file_name: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', error: false })

  const [profile, setProfile] = useState<ProfileState>({
    full_name: '',
    phone: '',
    open_to_recommendation: true,
    receive_job_mailing: true,
  })

  const [seeker, setSeeker] = useState<SeekerState>({
    headline: '',
    years_experience: '0',
    current_company: '',
    current_title: '',
    location: '',
    main_specializations: [],
    detailed_specialties: [],
    specialty_etc: '',
    qualifications: [],
    korea_partial_pass_subjects: [],
    us_partial_pass_subjects: [],
    us_partial_pass_etc: '',
    bio: '',
    linkedin_url: '',
    resume_file_path: null,
    resume_file_name: null,
  })

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)
      setUserEmail(user.email ?? '')

      const [{ data: p }, { data: sp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('job_seeker_profiles').select('*').eq('id', user.id).maybeSingle(),
      ])

      if (p) {
        setProfile({
          full_name: p.full_name ?? '',
          phone: p.phone ?? '',
          open_to_recommendation: p.open_to_recommendation ?? true,
          receive_job_mailing: p.receive_job_mailing ?? true,
        })
      }

      if (sp) {
        setSeeker({
          headline: sp.headline ?? '',
          years_experience: sp.years_experience?.toString() ?? '0',
          current_company: sp.current_company ?? '',
          current_title: sp.current_title ?? '',
          location: sp.location ?? '',
          main_specializations: sp.main_specializations ?? [],
          detailed_specialties: sp.detailed_specialties ?? [],
          specialty_etc: sp.specialty_etc ?? '',
          qualifications: sp.qualifications ?? [],
          korea_partial_pass_subjects: sp.korea_partial_pass_subjects ?? [],
          us_partial_pass_subjects: sp.us_partial_pass_subjects ?? [],
          us_partial_pass_etc: sp.us_partial_pass_etc ?? '',
          bio: sp.bio ?? '',
          linkedin_url: sp.linkedin_url ?? '',
          resume_file_path: sp.resume_file_path ?? null,
          resume_file_name: sp.resume_file_name ?? null,
        })
      }

      setLoading(false)
    }

    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setMessage({ text: '', error: false })

    const [r1, r2] = await Promise.all([
      supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          open_to_recommendation: profile.open_to_recommendation,
          receive_job_mailing: profile.receive_job_mailing,
        })
        .eq('id', userId),

      supabase.from('job_seeker_profiles').upsert({
        id: userId,
        headline: seeker.headline || null,
        years_experience: parseInt(seeker.years_experience) || 0,
        current_company: seeker.current_company || null,
        current_title: seeker.current_title || null,
        location: seeker.location || null,
        main_specializations: seeker.main_specializations,
        detailed_specialties: seeker.detailed_specialties,
        specialty_etc: seeker.specialty_etc || null,
        qualifications: seeker.qualifications,
        korea_partial_pass_subjects: seeker.korea_partial_pass_subjects,
        us_partial_pass_subjects: seeker.us_partial_pass_subjects,
        us_partial_pass_etc: seeker.us_partial_pass_etc || null,
        bio: seeker.bio || null,
        linkedin_url: seeker.linkedin_url || null,
        resume_file_path: seeker.resume_file_path,
        resume_file_name: seeker.resume_file_name,
        resume_updated_at: seeker.resume_file_path ? new Date().toISOString() : null,
      }),
    ])

    if (r1.error || r2.error) {
      setMessage({ text: '저장 중 오류가 발생했습니다.', error: true })
    } else {
      setMessage({ text: '프로필이 저장되었습니다.', error: false })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    setSaving(false)
  }

  const showKoreaSubjects = seeker.qualifications.includes('한국 일부합격')
  const showUsSubjects = seeker.qualifications.includes('미국 일부합격')
  const showSpecialtyEtc = seeker.detailed_specialties.includes('기타')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">내 프로필</h1>
        <p className="text-gray-500 text-sm mt-1">구직 활동에 사용될 정보를 입력해 주세요.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── A. 기본 정보 ── */}
        <Section title="기본 정보">
          <Field
            label="이름"
            value={profile.full_name}
            onChange={v => setProfile(p => ({ ...p, full_name: v }))}
          />
          <Field
            label="이메일"
            value={userEmail}
            onChange={() => {}}
            disabled
            placeholder="이메일은 변경할 수 없습니다"
          />
          <Field
            label="연락처"
            value={profile.phone}
            onChange={v => setProfile(p => ({ ...p, phone: v }))}
            placeholder="010-0000-0000"
          />
          <Field
            label="한 줄 소개"
            value={seeker.headline}
            onChange={v => setSeeker(s => ({ ...s, headline: v }))}
            placeholder="예: 생명보험 계리 5년차, IFRS17 평가 전문"
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="현재 재직 회사"
              value={seeker.current_company}
              onChange={v => setSeeker(s => ({ ...s, current_company: v }))}
              placeholder="회사명"
            />
            <Field
              label="현재 직함"
              value={seeker.current_title}
              onChange={v => setSeeker(s => ({ ...s, current_title: v }))}
              placeholder="계리팀 대리"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="근무 지역"
              value={seeker.location}
              onChange={v => setSeeker(s => ({ ...s, location: v }))}
              placeholder="서울, 경기 등"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">경력 연수</label>
              <select
                value={seeker.years_experience}
                onChange={e => setSeeker(s => ({ ...s, years_experience: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
              >
                <option value="0">신입</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}년</option>
                ))}
                <option value="11">10년 이상</option>
              </select>
            </div>
          </div>
          <Field
            label="LinkedIn URL"
            value={seeker.linkedin_url}
            onChange={v => setSeeker(s => ({ ...s, linkedin_url: v }))}
            placeholder="https://linkedin.com/in/..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자기소개</label>
            <textarea
              value={seeker.bio}
              onChange={e => setSeeker(s => ({ ...s, bio: e.target.value }))}
              rows={4}
              placeholder="간단한 자기소개를 작성해 주세요."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
            />
          </div>
        </Section>

        {/* ── B. 주요 분야 ── */}
        <Section title="주요 분야" description="해당하는 분야를 모두 선택해 주세요.">
          <MultiSelectChips
            options={[...MAIN_SPECIALIZATIONS]}
            selected={seeker.main_specializations}
            onChange={v => setSeeker(s => ({ ...s, main_specializations: v }))}
          />
        </Section>

        {/* ── C. 세부 전문 분야 ── */}
        <Section title="세부 전문 분야" description="해당하는 업무를 모두 선택해 주세요.">
          <MultiSelectChips
            options={[...DETAILED_SPECIALTIES]}
            selected={seeker.detailed_specialties}
            onChange={v => setSeeker(s => ({ ...s, detailed_specialties: v }))}
          />
          {showSpecialtyEtc && (
            <Field
              label="기타 업무 직접 입력"
              value={seeker.specialty_etc}
              onChange={v => setSeeker(s => ({ ...s, specialty_etc: v }))}
              placeholder="직접 입력해 주세요"
            />
          )}
        </Section>

        {/* ── D. 자격 및 시험 ── */}
        <Section title="자격 및 시험 합격 현황">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">보유 자격</label>
            <MultiSelectChips
              options={QUALIFICATIONS}
              selected={seeker.qualifications}
              onChange={v => setSeeker(s => ({ ...s, qualifications: v }))}
            />
          </div>

          {showKoreaSubjects && (
            <div className="pt-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                한국 계리사 일부합격 과목
              </label>
              <MultiSelectChips
                options={KOREA_PARTIAL_SUBJECTS}
                selected={seeker.korea_partial_pass_subjects}
                onChange={v => setSeeker(s => ({ ...s, korea_partial_pass_subjects: v }))}
              />
            </div>
          )}

          {showUsSubjects && (
            <div className="pt-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                미국 계리사 일부합격 과목
              </label>
              <MultiSelectChips
                options={US_PARTIAL_SUBJECTS}
                selected={seeker.us_partial_pass_subjects}
                onChange={v => setSeeker(s => ({ ...s, us_partial_pass_subjects: v }))}
              />
              {seeker.us_partial_pass_subjects.includes('기타 SOA 시험 / 모듈') && (
                <Field
                  label="기타 SOA 시험 / 모듈 직접 입력"
                  value={seeker.us_partial_pass_etc}
                  onChange={v => setSeeker(s => ({ ...s, us_partial_pass_etc: v }))}
                  placeholder="예: PA Bootcamp, DMAC 등"
                />
              )}
            </div>
          )}
        </Section>

        {/* ── E. 이력서 ── */}
        <Section title="이력서">
          {userId && (
            <ResumeUploader
              userId={userId}
              currentFileName={seeker.resume_file_name}
              currentFilePath={seeker.resume_file_path}
              onUpload={(path, name) =>
                setSeeker(s => ({ ...s, resume_file_path: path, resume_file_name: name }))
              }
              onRemove={() =>
                setSeeker(s => ({ ...s, resume_file_path: null, resume_file_name: null }))
              }
            />
          )}
        </Section>

        {/* ── F. 알림 및 공개 설정 ── */}
        <Section title="알림 및 공개 설정">
          <div className="space-y-4">
            <ToggleSwitch
              label="채용 추천 받기"
              description="기업 담당자가 내 프로필을 검색하고 연락할 수 있습니다."
              checked={profile.open_to_recommendation}
              onChange={v => setProfile(p => ({ ...p, open_to_recommendation: v }))}
            />
            <ToggleSwitch
              label="채용 메일링 구독"
              description="매주 나의 전문 분야에 맞는 채용공고를 보내드립니다."
              checked={profile.receive_job_mailing}
              onChange={v => setProfile(p => ({ ...p, receive_job_mailing: v }))}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            * 주간 채용 업데이트는 카카오 알림톡 또는 이메일로 발송될 예정입니다.
          </p>
        </Section>

        {message.text && (
          <p className={`text-sm ${message.error ? 'text-red-500' : 'text-green-600'}`}>
            {message.text}
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

// ─── Shared sub-components ─────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}
