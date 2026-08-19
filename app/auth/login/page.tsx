'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell, { AuthError, AuthFooterLink } from '@/components/auth/AuthShell'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/jobs'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(urlError || '')
  const [loading, setLoading] = useState(false)
  const [kakaoLoading, setKakaoLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'admin') {
        router.push('/admin')
        router.refresh()
        return
      }
    }

    router.push(redirectTo)
    router.refresh()
  }

  const handleKakaoLogin = async () => {
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
      setError('카카오 로그인에 실패했습니다. 다시 시도해 주세요.')
      setKakaoLoading(false)
    }
    // On success, browser follows the OAuth redirect
  }

  return (
    <AuthShell
      index="01 / Sign in"
      heading={
        <>
          Welcome
          <br />
          back.
        </>
      }
      statement="계정에 로그인하면 저장한 공고와 프로필을 이어서 볼 수 있습니다."
    >
      <AuthError
        message={
          error === 'auth_callback_failed'
            ? '인증에 실패했습니다. 다시 시도해 주세요.'
            : error
        }
      />

      {/* Kakao login */}
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={kakaoLoading || loading}
        className="btn btn-ghost w-full"
      >
        <KakaoIcon />
        {kakaoLoading ? '연결 중' : '카카오로 로그인'}
      </button>

      <div className="my-10 flex items-center gap-5">
        <hr className="rule flex-1" />
        <span className="label-sm">or</span>
        <hr className="rule flex-1" />
      </div>

      {/* Email login */}
      <form onSubmit={handleLogin} className="space-y-8">
        <div>
          <label htmlFor="login-email" className="form-label">
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="field"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="login-pw" className="form-label">
            비밀번호
          </label>
          <input
            id="login-pw"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="field"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between gap-6 pt-2">
          <button type="submit" disabled={loading || kakaoLoading} className="btn">
            {loading ? '로그인 중' : '이메일로 로그인'}
          </button>
          <Link href="/auth/forgot-password" className="label-sm link">
            비밀번호 찾기
          </Link>
        </div>
      </form>

      <AuthFooterLink prefix="계정이 없으신가요?" href="/auth/signup" label="회원가입" />
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
