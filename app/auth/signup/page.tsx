'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell, { AuthError, AuthFooterLink } from '@/components/auth/AuthShell'
import RoleSelect, { type SignupRole } from '@/components/auth/RoleSelect'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'job_seeker' as SignupRole,
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
    <AuthShell
      index="01 / Sign up"
      heading={
        <>
          Join the
          <br />
          index.
        </>
      }
      statement="계리 직군 공고와 보상 데이터를 한 곳에서 봅니다. 가입은 1분이면 끝납니다."
    >
      {message ? (
        <div>
          <p className="label-sm">Check your inbox</p>
          <p className="h3 mt-5">{message}</p>
          <p className="body mt-6 max-w-[42ch]">
            이메일 링크를 클릭하면 자동으로 로그인됩니다.
          </p>
        </div>
      ) : (
        <>
          <AuthError message={error} />

          {/* Kakao signup */}
          <button
            type="button"
            onClick={handleKakaoSignup}
            disabled={kakaoLoading || loading}
            className="btn btn-ghost w-full"
          >
            <KakaoIcon />
            {kakaoLoading ? '연결 중' : '카카오로 시작하기'}
          </button>

          <div className="my-10 flex items-center gap-5">
            <hr className="rule flex-1" />
            <span className="label-sm">or</span>
            <hr className="rule flex-1" />
          </div>

          {/* Email signup */}
          <form onSubmit={handleSignup} className="space-y-8">
            <RoleSelect value={form.role} onChange={v => update('role', v)} />

            <div>
              <label htmlFor="su-name" className="form-label">
                이름
              </label>
              <input
                id="su-name"
                type="text"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                required
                className="field"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="su-email" className="form-label">
                이메일
              </label>
              <input
                id="su-email"
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                className="field"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="su-pw" className="form-label">
                비밀번호
              </label>
              <input
                id="su-pw"
                type="password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                minLength={6}
                className="field"
                placeholder="6자 이상 입력"
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading || kakaoLoading} className="btn">
                {loading ? '처리 중' : '이메일로 회원가입'}
              </button>
            </div>
          </form>

          <AuthFooterLink prefix="이미 계정이 있으신가요?" href="/auth/login" label="로그인" />
        </>
      )}
    </AuthShell>
  )
}

function KakaoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.368c0 2.07 1.305 3.888 3.285 4.944l-.84 3.132a.188.188 0 0 0 .288.204l3.648-2.412c.36.048.726.072 1.119.072 4.142 0 7.5-2.634 7.5-5.868C16.5 4.134 13.142 1.5 9 1.5Z"
        fill="currentColor"
      />
    </svg>
  )
}
