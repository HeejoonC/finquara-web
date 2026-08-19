'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthShell from '@/components/auth/AuthShell'

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    // Listen for PASSWORD_RECOVERY (fires after successful exchange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })

    const code = new URLSearchParams(window.location.search).get('code')

    if (!code) {
      setError('유효하지 않은 링크입니다. 비밀번호 찾기를 다시 시도해 주세요.')
      subscription.unsubscribe()
      return
    }

    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error: exchangeError }) => {
        if (!exchangeError && data.session) {
          setReady(true)
        } else {
          // Exchange failed — check if session already exists (e.g. auto-exchanged)
          return supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setReady(true)
            } else {
              setError('링크가 만료되었거나 이미 사용된 링크입니다. 비밀번호 찾기를 다시 시도해 주세요.')
            }
          })
        }
      })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('비밀번호 변경에 실패했습니다.')
      setLoading(false)
      return
    }

    router.push('/jobs')
    router.refresh()
  }

  return (
    <AuthShell
      index="02 / Recover"
      heading={
        <>
          Set a new
          <br />
          password.
        </>
      }
      statement="새 비밀번호를 입력하면 즉시 적용되고 로그인 상태로 이동합니다."
    >
      {error && (
        <div className="notice mb-8">
          {error}
          <div className="mt-3">
            <Link href="/auth/forgot-password" className="label-sm link">
              비밀번호 찾기로 돌아가기
            </Link>
          </div>
        </div>
      )}

      {ready && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="rp-pw" className="form-label">
              새 비밀번호
            </label>
            <input
              id="rp-pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="field"
              placeholder="6자 이상 입력"
            />
          </div>

          <div>
            <label htmlFor="rp-pw2" className="form-label">
              비밀번호 확인
            </label>
            <input
              id="rp-pw2"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              className="field"
              placeholder="비밀번호 재입력"
            />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn">
              {loading ? '변경 중' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      )}

      {!ready && !error && <p className="label-sm">Verifying link…</p>}
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
