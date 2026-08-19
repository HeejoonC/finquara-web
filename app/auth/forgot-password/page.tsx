'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthShell, { AuthError } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <AuthShell
      index="01 / Recover"
      heading={
        <>
          Reset your
          <br />
          password.
        </>
      }
      statement="가입한 이메일 주소로 비밀번호 재설정 링크를 보내드립니다."
    >
      {sent ? (
        <div>
          <p className="label-sm">Sent</p>
          <p className="h3 mt-5">이메일을 전송했습니다.</p>
          <p className="body mt-6 max-w-[42ch]">
            {email} 주소로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인해 주세요.
          </p>
          <p className="mt-10">
            <Link href="/auth/login" className="label link">
              ← 로그인으로 돌아가기
            </Link>
          </p>
        </div>
      ) : (
        <>
          <AuthError message={error} />

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="fp-email" className="form-label">
                이메일
              </label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="field"
                placeholder="example@email.com"
              />
            </div>

            <div className="flex items-center justify-between gap-6 pt-2">
              <button type="submit" disabled={loading} className="btn">
                {loading ? '전송 중' : '재설정 링크 보내기'}
              </button>
              <Link href="/auth/login" className="label-sm link">
                로그인으로
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  )
}
