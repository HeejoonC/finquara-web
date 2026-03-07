'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    specialization: 'actuarial',
    experience_level: '',
    salary_range: '',
    description: '',
    apply_url: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerId || !companyName) return
    setSubmitting(true)
    setMessage('')

    const { error } = await supabase.from('jobs').insert({
      ...form,
      company: companyName,
      owner_id: ownerId,
      is_published: false,
    })

    if (error) {
      setMessage('등록 중 오류가 발생했습니다: ' + error.message)
    } else {
      setMessage('채용공고가 등록되었습니다. 관리자 검토 후 게시됩니다.')
      setForm({
        title: '', location: '', specialization: 'actuarial',
        experience_level: '', salary_range: '', description: '', apply_url: '',
      })
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">채용공고 등록</h1>
      <p className="text-gray-500 text-sm mb-2">
        기업: <span className="font-medium text-gray-700">{companyName}</span>
      </p>
      <p className="text-gray-400 text-xs mb-8">등록 후 관리자 승인 시 공개됩니다.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <Field label="공고 제목" value={form.title} onChange={v => update('title', v)} required placeholder="예: 계리사 (신입/경력)" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="근무지" value={form.location} onChange={v => update('location', v)} placeholder="서울, 부산 등" />
            <SelectField
              label="경력 요건"
              value={form.experience_level}
              onChange={v => update('experience_level', v)}
              options={['신입', '1~3년', '3~5년', '5~7년', '7년 이상', '경력무관']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="전문 분야"
              value={form.specialization}
              onChange={v => update('specialization', v)}
              options={['actuarial', '생명보험', '손해보험', '재보험', '연금', '자산운용', '리스크관리']}
            />
            <Field label="급여 조건" value={form.salary_range} onChange={v => update('salary_range', v)} placeholder="면접 후 결정, 6000~8000만원 등" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              공고 내용 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              placeholder="업무 내용, 자격 요건, 우대 사항 등을 입력해 주세요."
            />
          </div>

          <Field label="지원 URL" value={form.apply_url} onChange={v => update('apply_url', v)} placeholder="https://..." />
        </div>

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

function Field({ label, value, onChange, placeholder, required }: {
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
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
