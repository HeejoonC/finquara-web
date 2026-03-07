'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CompanyProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState({ full_name: '', phone: '' })
  const [company, setCompany] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    website: '',
    description: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('companies').select('*').eq('owner_id', user.id).single(),
      ])

      if (p) setProfile({ full_name: p.full_name || '', phone: p.phone || '' })
      if (c) setCompany({
        company_name: c.company_name || '',
        industry: c.industry || '',
        company_size: c.company_size || '',
        website: c.website || '',
        description: c.description || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setMessage('')

    const [r1, r2] = await Promise.all([
      supabase.from('profiles').update({ ...profile }).eq('id', userId),
      supabase.from('companies').upsert({ owner_id: userId, ...company }),
    ])

    if (r1.error || r2.error) {
      setMessage('저장 중 오류가 발생했습니다.')
    } else {
      setMessage('기업 정보가 저장되었습니다.')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">기업 프로필</h1>
      <p className="text-gray-500 text-sm mb-8">채용공고 등록에 사용될 기업 정보를 입력해 주세요.</p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 담당자 정보 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">담당자 정보</h2>
          <Field label="담당자 이름" value={profile.full_name} onChange={v => setProfile(p => ({ ...p, full_name: v }))} required />
          <Field label="연락처" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="010-0000-0000" />
        </section>

        {/* 기업 정보 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800">기업 정보</h2>
          <Field label="기업명" value={company.company_name} onChange={v => setCompany(c => ({ ...c, company_name: v }))} required />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="업종"
              value={company.industry}
              onChange={v => setCompany(c => ({ ...c, industry: v }))}
              options={['보험', '재보험', '자산운용', '연금', '금융감독', '컨설팅', '기타']}
            />
            <SelectField
              label="기업 규모"
              value={company.company_size}
              onChange={v => setCompany(c => ({ ...c, company_size: v }))}
              options={['10명 미만', '10~50명', '50~200명', '200~1000명', '1000명 이상']}
            />
          </div>
          <Field label="웹사이트" value={company.website} onChange={v => setCompany(c => ({ ...c, website: v }))} placeholder="https://company.com" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기업 소개</label>
            <textarea
              value={company.description}
              onChange={e => setCompany(c => ({ ...c, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
              placeholder="기업 소개를 작성해 주세요."
            />
          </div>
        </section>

        {message && (
          <p className={`text-sm ${message.includes('오류') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-[#2563EB] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/post')}
            className="px-6 py-3 border border-[#2563EB] text-[#2563EB] rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            채용공고 등록 →
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
