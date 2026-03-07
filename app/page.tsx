'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleWaitlist = async (e: React.FormEvent) => {
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

  return (
    <main>
      {/* 히어로 섹션 */}
      <section className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white text-center px-6">
        <h1 className="text-5xl font-bold text-[#0B1F3A] mb-4">Finquara</h1>
        <p className="text-xl text-gray-600 mb-3">이직부터 네트워킹까지, 대한민국 계리인재들이 소통하는 허브</p>
        <p className="text-sm text-gray-400 mb-10">Beyond Jobs, Towards Insights. 네트워킹과 데이터 기반의 이직 전략을 경험하세요.</p>

        <div className="flex gap-4 mb-16">
          <Link
            href="/jobs"
            className="px-6 py-3 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            채용공고 보기
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 border border-[#2563EB] text-[#2563EB] rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            지금 시작하기
          </Link>
        </div>

        {/* 특징 */}
        <div className="grid grid-cols-3 gap-6 max-w-2xl w-full text-left">
          {[
            { icon: '🎯', title: 'Precision Matching', desc: '단순 공고가 아닙니다. 계리사 커리어 패스를 분석해 최적의 포지션을 제안합니다.' },
            { icon: '📊', title: 'Real-time Benchmarking', desc: "매년 업데이트되는 '계리사 연봉 지도'를 통해 나의 시장 가치를 실시간으로 확인하세요." },
            { icon: '💬', title: 'Peer Insight Network', desc: '익명이 보장된 게시판에서 업계 소식, 시험 팁, 그리고 커리어 정보를 공유합니다.' },
          ].map(f => (
            <div key={f.title} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{f.title}</div>
              <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 대기목록 섹션 */}
      <section className="py-20 px-6 bg-[#0B1F3A] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Stay Ahead of the Curve</h2>
        <p className="text-white/60 text-sm mb-8">계리사를 위한 채용 소식과 업계 뉴스레터를 가장 먼저 받아보세요.</p>

        {status === 'success' ? (
          <div className="max-w-md mx-auto bg-white/10 rounded-xl p-6 text-white">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-medium">대기목록에 등록되었습니다!</p>
            <p className="text-white/60 text-sm mt-1">새로운 소식이 생기면 이메일로 안내드릴게요.</p>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} className="max-w-md mx-auto space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="이메일 주소"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 text-sm"
            />
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="관심 분야 (예: 생명보험, 손해보험, 컨설팅)"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/50 text-sm"
            />
            {status === 'error' && (
              <p className="text-red-400 text-xs">등록 중 오류가 발생했습니다. 다시 시도해 주세요.</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {status === 'loading' ? '등록 중...' : '대기목록 등록'}
            </button>
          </form>
        )}

        <p className="text-white/30 text-xs mt-6">보험사, 재보험사, 회계계리법인, 컨설팅펌 — 대한민국 계리인재의 허브</p>
      </section>
    </main>
  )
}
