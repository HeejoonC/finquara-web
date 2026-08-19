'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.from('waitlist').insert({ email, note: note || null })
    if (error) {
      setStatus('error')
    } else {
      setStatus('success')
      setEmail('')
      setNote('')
    }
  }

  if (status === 'success') {
    return (
      <div className="border-t border-line-strong pt-8">
        <p className="label-sm">Registered</p>
        <p className="h4 mt-4">등록이 완료되었습니다.</p>
        <p className="body-sm mt-3 max-w-[42ch]">
          새 공고와 시장 데이터가 갱신되면 이메일로 먼저 알려드립니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line-strong pt-8">
      <div className="grid grid-cols-2 gap-x-10 gap-y-6 fold-720">
        <div>
          <label htmlFor="wl-email" className="form-label">
            Email
          </label>
          <input
            id="wl-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="actuary@company.com"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="wl-note" className="form-label">
            관심 분야 (선택)
          </label>
          <input
            id="wl-note"
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="생보 · 손보 · 재보험 · 컨설팅"
            className="field"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <button type="submit" disabled={status === 'loading'} className="btn">
          {status === 'loading' ? 'Sending' : 'Request access'}
        </button>
        {status === 'error' && (
          <span className="body-sm">잠시 후 다시 시도해 주세요.</span>
        )}
      </div>
    </form>
  )
}
