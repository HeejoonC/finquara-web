'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A192F]">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.png"
          alt="Finquara Network Background"
          fill
          className="object-cover object-center opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F]/80 via-[#0A192F]/90 to-[#0A192F]" />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col items-center text-center">

        {/* 히어로 섹션 */}
        <div className="max-w-4xl mx-auto mb-20">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-100 to-amber-200">
            Finquara
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">
            이직부터 네트워킹까지,<br className="md:hidden" /> 대한민국 계리인재들이 소통하는 허브
          </h2>
          <p className="text-lg text-blue-100/80 mb-10 max-w-2xl mx-auto font-light">
            Beyond Jobs, Towards Insights.<br />
            검증된 데이터와 전문적인 네트워킹으로 당신의 커리어 전략을 완성하세요.
          </p>

          {/* 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/jobs"
              className="px-8 py-4 bg-[#2563EB] text-white rounded-xl text-base font-semibold hover:bg-[#1d4ed8] transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              채용공고 확인하기
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-xl text-base font-semibold hover:bg-white/10 transition-all"
            >
              지금 시작하기
            </Link>
          </div>

          {/* 특징 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            {[
              { icon: '🎯', title: 'Precision Matching', desc: '단순 공고가 아닙니다. 계리사 커리어 패스를 분석해 최적의 포지션을 제안합니다.' },
              { icon: '📊', title: 'Real-time Benchmarking', desc: "매년 업데이트되는 '계리사 연봉 지도'를 통해 시장 가치를 확인하세요." },
              { icon: '💬', title: 'Peer Insight Network', desc: '익명이 보장된 공간에서 시험 팁, 실무 노하우 등 진짜 정보를 공유합니다.' },
            ].map(f => (
              <div key={f.title} className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:border-blue-400/30 transition-colors group">
                <div className="text-3xl mb-4 bg-blue-500/20 w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-blue-100/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 대기목록 섹션 */}
        <div className="w-full max-w-md mx-auto mt-10 pt-10 border-t border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">Stay Ahead of the Curve</h2>
          <p className="text-blue-100/60 text-sm mb-6">계리사를 위한 독점적인 채용 소식과 뉴스레터를 가장 먼저 받아보세요.</p>

          {status === 'success' ? (
            <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-xl p-6 text-white text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="font-bold text-lg">등록이 완료되었습니다!</p>
              <p className="text-blue-100/70 text-sm mt-2">Finquara의 새로운 소식을 이메일로 가장 먼저 전해드릴게요.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="space-y-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="이메일 주소 (예: actuary@korea.com)"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all text-sm"
              />
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="관심 분야 (선택사항: 생보, 손보, 컨설팅 등)"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all text-sm"
              />
              {status === 'error' && (
                <p className="text-red-300 text-xs text-center">일시적인 오류가 발생했습니다.</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#1e40af] text-white rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
              >
                {status === 'loading' ? '처리 중...' : '사전 등록하기'}
              </button>
            </form>
          )}

          <p className="text-white/30 text-xs mt-8">
            보험사 · 재보험사 · 회계법인 · 컨설팅펌<br />
            대한민국 No.1 계리인재 플랫폼
          </p>
        </div>
      </div>
    </main>
  )
}
