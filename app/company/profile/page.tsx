'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormSection, TextField, TextArea, SelectField, PageHeader } from '@/components/ui/Form'

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
    return (
      <main className="section">
        <div className="container">
          <p className="label-sm">Loading…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="section-tight">
      <div className="container">
        <PageHeader
          index="Company"
          title={
            <>
              Company
              <br />
              profile.
            </>
          }
          description="채용공고 등록에 사용될 기업 정보입니다. 공고에는 여기 입력한 기업명이 표시됩니다."
        />

        <form onSubmit={handleSave} className="mt-4">
          {/* 담당자 정보 */}
          <FormSection step="1" title="담당자 정보">
            <div className="grid grid-cols-2 gap-8 fold-720">
              <TextField
                label="담당자 이름"
                value={profile.full_name}
                onChange={v => setProfile(p => ({ ...p, full_name: v }))}
                required
              />
              <TextField
                label="연락처"
                value={profile.phone}
                onChange={v => setProfile(p => ({ ...p, phone: v }))}
                placeholder="010-0000-0000"
              />
            </div>
          </FormSection>

          {/* 기업 정보 */}
          <FormSection step="2" title="기업 정보">
            <TextField
              label="기업명"
              value={company.company_name}
              onChange={v => setCompany(c => ({ ...c, company_name: v }))}
              required
            />
            <div className="grid grid-cols-2 gap-8 fold-720">
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
            <TextField
              label="웹사이트"
              value={company.website}
              onChange={v => setCompany(c => ({ ...c, website: v }))}
              placeholder="https://company.com"
            />
            <TextArea
              label="기업 소개"
              value={company.description}
              onChange={v => setCompany(c => ({ ...c, description: v }))}
              rows={5}
              placeholder="기업 소개를 작성해 주세요."
            />
          </FormSection>

          <div className="border-t border-line-strong pt-10">
            {message && <div className="notice mb-8">{message}</div>}
            <div className="flex flex-wrap gap-4">
              <button type="submit" disabled={saving} className="btn">
                {saving ? '저장 중' : '저장하기'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/post')}
                className="btn btn-ghost"
              >
                채용공고 등록 →
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
