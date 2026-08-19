'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell, { AuthError } from '@/components/auth/AuthShell'
import RoleSelect, { type SignupRole } from '@/components/auth/RoleSelect'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    role: 'job_seeker' as SignupRole,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Pre-fill whatever Kakao already provided
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm(f => ({
          ...f,
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          role: (profile.role as SignupRole) || 'job_seeker',
        }))
      }
    }

    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!form.phone.trim()) {
      setError('연락처를 입력해 주세요.')
      return
    }

    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        role: form.role,
      })
      .eq('id', userId)

    if (updateError) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setSaving(false)
      return
    }

    router.push(form.role === 'employer' ? '/company/profile' : '/profile')
    router.refresh()
  }

  return (
    <AuthShell
      index="02 / Onboarding"
      heading={
        <>
          Almost
          <br />
          there.
        </>
      }
      statement="서비스 이용을 위해 추가 정보를 입력해 주세요. 두 항목이면 끝납니다."
    >
      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="space-y-8">
        <RoleSelect value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />

        <div>
          <label htmlFor="ob-name" className="form-label">
            이름
          </label>
          <input
            id="ob-name"
            type="text"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            required
            className="field"
            placeholder="홍길동"
          />
        </div>

        <div>
          <label htmlFor="ob-phone" className="form-label">
            연락처 (필수)
          </label>
          <input
            id="ob-phone"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            required
            className="field"
            placeholder="010-0000-0000"
          />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn">
            {saving ? '저장 중' : '시작하기'}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
