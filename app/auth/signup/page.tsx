'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'job_seeker' as 'job_seeker' | 'employer',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleKakaoSignup = async () => {
    setKakaoLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile_nickname profile_image',
      },
    })

    if (error) {
      setError('카카오 연동에 실패했습니다. 다시 시도해 주세요.')
      setKakaoLoading(false)
    }
    // Browser follows OAuth redirect — callback will detect missing profile and redirect to /auth/onboarding
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, role: form.role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push(form.role === 'employer' ? '/company/profile' : '/profile')
      router.refresh()
    } else {
      setMessage('가입 확인 이메일을 발송했습니다. 이메일을 확인해 주세요.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#0B1F3A]">Finquara</Link>
          <p className="mt-2 text-gray-500 text-sm">새 계정을 만드세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {message ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <p className="text-gray-700 font-medium">{message}</p>
              <p className="text-gray-500 text-sm mt-2">
                이메일 링크를 클릭하면 자동으로 로그인됩니다.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Kakao signup */}
              <button
                type="button"
                onClick={handleKakaoSignup}
                disabled={kakaoLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#FEE500', color: '#191919' }}
              >
                <KakaoIcon />
                {kakaoLoading ? '연결 중...' : '카카오로 시작하기'}
              </button>

              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-3 text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email signup */}
              <form onSubmit={handleSignup} className="space-y-4">
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
                        onClick={() => update('role', opt.value)}
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
                    onChange={e => update('full_name', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    placeholder="6자 이상 입력"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || kakaoLoading}
                  className="w-full py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? '처리 중...' : '이메일로 회원가입'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="text-[#2563EB] font-medium hover:underline">
                  로그인
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.368c0 2.07 1.305 3.888 3.285 4.944l-.84 3.132a.188.188 0 0 0 .288.204l3.648-2.412c.36.048.726.072 1.119.072 4.142 0 7.5-2.634 7.5-5.868C16.5 4.134 13.142 1.5 9 1.5Z"
        fill="#191919"
      />
    </svg>
  )
}
