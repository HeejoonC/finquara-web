'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

export default function PostJobPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [ownerId, setOwnerId] = useState('')

  const [form, setForm] = useState({
    title: '',
    location: '',
    experience_level: '',
    employment_type: '',
    salary_range: '',
    description: '',
    apply_url: '',
  })
  const [mainSpecializations, setMainSpecializations] = useState<string[]>([])
  const [detailedSpecialties, setDetailedSpecialties] = useState<string[]>([])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'employer') {
        router.push('/')
        return
      }

      const { data: company } = await supabase
        .from('companies')
        .select('company_name')
        .eq('owner_id', user.id)
        .single()

      if (!company) {
        router.push('/company/profile')
        return
      }

      setCompanyName(company.company_name)
      setOwnerId(user.id)
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
    if (!ownerId || !companyName) return
    setSubmitting(true)
    setMessage('')

    const { error } = await supabase.from('jobs').insert({
      ...form,
      company: companyName,
      owner_id: ownerId,
      main_specializations: mainSpecializations,
      detailed_specialties: detailedSpecialties,
      is_published: false,
    })

    if (error) {
      setMessage('등록 중 오류가 발생했습니다: ' + error.message)
    } else {
      setMessage('채용공고가 등록되었습니다. 관리자 검토 후 게시됩니다.')
      setForm({
        title: '',
        location: '',
        experience_level: '',
        employment_type: '',
        salary_range: '',
        description: '',
        apply_url: '',
      })
      setMainSpecializations([])
      setDetailedSpecialties([])
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">채용공고 등록</h1>
      <p className="text-gray-500 text-sm mb-1">
        기업: <span className="font-medium text-gray-700">{companyName}</span>
      </p>
      <p className="text-gray-400 text-xs mb-8">등록 후 관리자 승인 시 공개됩니다.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Section title="기본 정보">
          <TextField
            label="공고 제목"
            value={form.title}
            onChange={v => update('title', v)}
            required
            placeholder="예: 계리사 (신입/경력)"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="근무지"
              value={form.location}
              onChange={v => update('location', v)}
              placeholder="서울, 부산 등"
            />
            <TextField
              label="지원 URL"
              value={form.apply_url}
              onChange={v => update('apply_url', v)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="경력 요건"
              value={form.experience_level}
              onChange={v => update('experience_level', v)}
              options={[...EXPERIENCE_LEVELS]}
            />
            <SelectField
              label="고용형태"
              value={form.employment_type}
              onChange={v => update('employment_type', v)}
              options={[...EMPLOYMENT_TYPES]}
            />
          </div>

          <TextField
            label="급여 조건"
            value={form.salary_range}
            onChange={v => update('salary_range', v)}
            placeholder="면접 후 결정, 연 6,000~8,000만원 등"
          />
        </Section>

        {/* Actuarial taxonomy */}
        <Section title="전문 분야">
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

        {/* Description */}
        <Section title="공고 내용">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세 내용 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              placeholder="업무 내용, 자격 요건, 우대 사항 등을 입력해 주세요."
            />
          </div>
        </Section>

        {message && (
          <p className={`text-sm ${message.includes('오류') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? '등록 중...' : '채용공고 등록'}
        </button>
      </form>
    </div>
  )
}

/* ─── Local helpers ─────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
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
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
