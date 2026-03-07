'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'
import ExperienceField from '@/components/jobs/ExperienceField'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false })

const WORKPLACE_TYPES = ['대면 근무', '원격 근무', '하이브리드'] as const

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [form, setForm] = useState({
    title: '',
    location: '',
    workplace_type: '',
    experience_level: '',
    employment_type: '',
    salary_range: '',
    apply_url: '',
    contact_email: '',
    contact_phone: '',
    description: '',
  })
  const [mainSpecializations, setMainSpecializations] = useState<string[]>([])
  const [detailedSpecialties, setDetailedSpecialties] = useState<string[]>([])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { id } = await params

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (!job || job.owner_id !== user.id) { router.push('/jobs'); return }

      // Split location back into parts
      const locParts = (job.location ?? '').split(' · ')
      const location = locParts[0] ?? ''
      const workplace_type = locParts[1] ?? ''

      // Split contact_info back
      const contactParts = (job.contact_info ?? '').split(' / ')

      setJobId(id)
      setForm({
        title: job.title ?? '',
        location,
        workplace_type,
        experience_level: job.experience_level ?? '',
        employment_type: job.employment_type ?? '',
        salary_range: job.salary_range ?? '',
        apply_url: job.apply_url ?? '',
        contact_email: contactParts[0] ?? '',
        contact_phone: contactParts[1] ?? '',
        description: job.description ?? '',
      })
      setMainSpecializations(job.main_specializations ?? [])
      setDetailedSpecialties(job.detailed_specialties ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function toggleMain(value: string) {
    setMainSpecializations(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function toggleDetail(value: string) {
    setDetailedSpecialties(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const locationParts = [form.location, form.workplace_type].filter(Boolean)
    const combinedLocation = locationParts.join(' · ')

    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.title,
        location: combinedLocation || null,
        experience_level: form.experience_level || null,
        employment_type: form.employment_type || null,
        salary_range: form.salary_range || null,
        description: form.description || null,
        apply_url: form.apply_url || null,
        contact_info: [form.contact_email, form.contact_phone].filter(Boolean).join(' / ') || null,
        main_specializations: mainSpecializations,
        detailed_specialties: detailedSpecialties,
      })
      .eq('id', jobId)

    if (error) {
      setMessage('수정 중 오류가 발생했습니다: ' + error.message)
      setSubmitting(false)
    } else {
      router.push(`/jobs/${jobId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">채용공고 수정</h1>
        <p className="text-gray-400 text-xs mt-0.5">수정 후 바로 반영됩니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. 직무 정보 */}
        <Section step="1" title="직무 정보">
          <TextField
            label="직책 (공고 제목)"
            value={form.title}
            onChange={v => update('title', v)}
            required
            placeholder="예: 생명보험 계리사 (신입/경력)"
          />

          <div className="grid grid-cols-2 gap-4 items-start">
            <TextField
              label="근무 지역"
              value={form.location}
              onChange={v => update('location', v)}
              placeholder="서울, 부산 등"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">근무 형태</label>
              <div className="flex flex-col gap-2">
                {WORKPLACE_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="workplace_type"
                      value={t}
                      checked={form.workplace_type === t}
                      onChange={() => update('workplace_type', t)}
                      className="accent-[#2563EB]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 2. 고용 조건 */}
        <Section step="2" title="고용 조건">
          <div className="grid grid-cols-2 gap-4 items-start">
            <SelectField
              label="고용형태"
              value={form.employment_type}
              onChange={v => update('employment_type', v)}
              options={[...EMPLOYMENT_TYPES]}
            />
            <ExperienceField
              value={form.experience_level}
              onChange={v => update('experience_level', v)}
            />
          </div>
          <TextField
            label="급여 범위"
            value={form.salary_range}
            onChange={v => update('salary_range', v)}
            placeholder="예: 연 5,000~7,000만원, 면접 후 결정"
          />
        </Section>

        {/* 3. 전문 분야 */}
        <Section step="3" title="전문 분야">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주요 분야{' '}
              <span className="text-gray-400 font-normal">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MAIN_SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleMain(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    mainSpecializations.includes(s)
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              세부 전문 분야{' '}
              <span className="text-gray-400 font-normal">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DETAILED_SPECIALTIES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleDetail(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    detailedSpecialties.includes(s)
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* 4. 모집 요강 */}
        <Section step="4" title="모집 요강">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              업무내용, 자격요건, 우대사항, 복지 등 자유롭게 작성하세요.
            </p>
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              className="text-xs px-3 py-1.5 border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0 ml-3"
            >
              {showPreview ? '편집으로 돌아가기' : '미리보기'}
            </button>
          </div>

          {showPreview ? (
            <div className="border border-gray-200 rounded-lg p-5 bg-white min-h-[400px]">
              <h3 className="text-sm font-semibold text-gray-500 mb-3 border-b pb-2">
                미리보기
              </h3>
              {form.description && form.description !== '<p></p>' ? (
                <div
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: form.description }}
                />
              ) : (
                <p className="text-gray-400 text-sm">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
              )}
            </div>
          ) : (
            <RichTextEditor
              value={form.description}
              onChange={v => update('description', v)}
              placeholder="업무 내용, 자격 요건, 우대 사항, 복지 및 혜택 등을 자유롭게 입력하세요."
            />
          )}
        </Section>

        {/* 5. 지원 방법 */}
        <Section step="5" title="지원 방법">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="지원 링크"
              value={form.apply_url}
              onChange={v => update('apply_url', v)}
              placeholder="https://..."
            />
            <TextField
              label="담당자 이메일"
              value={form.contact_email}
              onChange={v => update('contact_email', v)}
              placeholder="예: recruit@example.com"
            />
            <TextField
              label="담당자 연락처"
              value={form.contact_phone}
              onChange={v => update('contact_phone', v)}
              placeholder="예: 010-1234-5678"
            />
          </div>
        </Section>

        {message && (
          <p className="text-sm text-red-500">{message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? '저장 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
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
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
