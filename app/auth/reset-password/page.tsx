'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#0B1F3A]">Finquara</Link>
          <p className="mt-2 text-gray-500 text-sm">새 비밀번호 설정</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
              <div className="mt-2">
                <Link href="/auth/forgot-password" className="underline">
                  비밀번호 찾기로 돌아가기
                </Link>
              </div>
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="6자 이상 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="비밀번호 재입력"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {!ready && !error && (
            <p className="text-center text-sm text-gray-500">링크 확인 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
