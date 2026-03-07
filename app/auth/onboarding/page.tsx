'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    role: 'job_seeker' as 'job_seeker' | 'employer',
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
          role: (profile.role as 'job_seeker' | 'employer') || 'job_seeker',
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">프로필 완성하기</h1>
          <p className="text-gray-500 text-sm mt-2">
            서비스 이용을 위해 추가 정보를 입력해 주세요.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">가입 유형</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'job_seeker', label: '구직자', desc: '채용공고 검색 및 지원' },
                  { value: 'employer', label: '기업 담당자', desc: '채용공고 등록 및 관리' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: opt.value as 'job_seeker' | 'employer' }))}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      form.role === opt.value
                        ? 'border-[#2563EB] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="010-0000-0000"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? '저장 중...' : '시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
