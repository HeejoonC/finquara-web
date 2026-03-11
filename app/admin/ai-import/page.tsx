'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { JobImport, ScrapeEvent } from '@/lib/ai-import/types'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

// ── Helpers ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobImport['status'] }) {
  const map = {
    pending:  'bg-yellow-50 text-yellow-700 border-yellow-100',
    approved: 'bg-green-50  text-green-700  border-green-100',
    rejected: 'bg-red-50    text-red-600    border-red-100',
  }
  const labels = { pending: '검토 대기', approved: '승인됨', rejected: '거절됨' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

function SiteChip({ site }: { site: string | null }) {
  if (!site) return null
  const colors: Record<string, string> = {
    '사람인':      'bg-blue-50   text-blue-700',
    '잡코리아':    'bg-purple-50 text-purple-700',
    'LinkedIn':    'bg-sky-50    text-sky-700',
    'JobsDB HK':   'bg-red-50    text-red-700',
    'JobsDB SG':   'bg-orange-50 text-orange-700',
    'eFinancialCareers HK': 'bg-pink-50 text-pink-700',
    'eFinancialCareers SG': 'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[site] ?? 'bg-gray-100 text-gray-600'}`}>
      {site}
    </span>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────

function EditModal({
  job,
  onClose,
  onSave,
}: {
  job: JobImport
  onClose: () => void
  onSave: (edits: Partial<JobImport>) => void
}) {
  const [form, setForm] = useState({ ...job })

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">공고 수정 후 승인</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">직책명 *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">회사명 *</label>
              <input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Location & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">지역</label>
              <input
                value={form.location ?? ''}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">경력</label>
              <select
                value={form.experience_level ?? ''}
                onChange={e => setForm(f => ({ ...f, experience_level: e.target.value as JobImport['experience_level'] }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">선택</option>
                {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Employment type & Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">고용형태</label>
              <select
                value={form.employment_type ?? ''}
                onChange={e => setForm(f => ({ ...f, employment_type: e.target.value as JobImport['employment_type'] }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">선택</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">급여</label>
              <input
                value={form.salary_range ?? ''}
                onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))}
                placeholder="예: 6,000~9,000만원 / 협의"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Main specializations */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">보험권역</label>
            <div className="flex flex-wrap gap-1.5">
              {MAIN_SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, main_specializations: toggle(f.main_specializations, s) as JobImport['main_specializations'] }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.main_specializations.includes(s)
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed specialties */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">직무분야</label>
            <div className="flex flex-wrap gap-1.5">
              {DETAILED_SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, detailed_specialties: toggle(f.detailed_specialties, s) as JobImport['detailed_specialties'] }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.detailed_specialties.includes(s)
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Apply URL */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">지원 링크</label>
            <input
              value={form.apply_url ?? ''}
              onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">공고 내용</label>
            <textarea
              rows={6}
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
            />
          </div>

          {/* AI Notes (read-only) */}
          {job.ai_notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">AI 분류 메모</p>
              <p className="text-xs text-blue-600">{job.ai_notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:opacity-90"
          >
            수정 후 승인
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Job Row ───────────────────────────────────────────────────────────────

function JobRow({
  job,
  onApprove,
  onEdit,
  onReject,
  onDelete,
  loading,
}: {
  job: JobImport
  onApprove: () => void
  onEdit: () => void
  onReject: () => void
  onDelete: () => void
  loading: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-100">
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-gray-300 hover:text-gray-500 shrink-0"
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900 leading-tight">{job.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-600">{job.location || '—'}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {job.main_specializations?.slice(0, 2).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{s}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {job.detailed_specialties?.slice(0, 2).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{s}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          <SiteChip site={job.source_site} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={job.status} />
        </td>
        <td className="px-4 py-3 text-right">
          {job.status === 'pending' ? (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={onApprove}
                disabled={loading}
                title="바로 승인 (채용공고 생성)"
                className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                승인
              </button>
              <button
                onClick={onEdit}
                disabled={loading}
                title="수정 후 승인"
                className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                수정
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                title="거절"
                className="px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
              >
                거절
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              {job.job_id && (
                <Link
                  href={`/jobs/${job.job_id}`}
                  target="_blank"
                  className="text-xs text-[#2563EB] hover:underline"
                >
                  공고 보기 →
                </Link>
              )}
              <button
                onClick={onDelete}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-gray-700 mb-1">공고 내용</p>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.description || '(내용 없음)'}
                </p>
              </div>
              <div className="space-y-2">
                {job.salary_range && (
                  <div>
                    <span className="font-medium text-gray-700">급여: </span>
                    <span className="text-gray-600">{job.salary_range}</span>
                  </div>
                )}
                {job.experience_level && (
                  <div>
                    <span className="font-medium text-gray-700">경력: </span>
                    <span className="text-gray-600">{job.experience_level}</span>
                  </div>
                )}
                {job.employment_type && (
                  <div>
                    <span className="font-medium text-gray-700">고용형태: </span>
                    <span className="text-gray-600">{job.employment_type}</span>
                  </div>
                )}
                {job.apply_url && (
                  <div>
                    <span className="font-medium text-gray-700">지원링크: </span>
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline break-all"
                    >
                      {job.apply_url}
                    </a>
                  </div>
                )}
                {job.source_url && job.source_url !== job.apply_url && (
                  <div>
                    <span className="font-medium text-gray-700">출처: </span>
                    <a href={job.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-500 hover:underline break-all"
                    >
                      {job.source_url}
                    </a>
                  </div>
                )}
                {job.ai_notes && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                    <p className="font-medium text-blue-700 mb-0.5">AI 메모</p>
                    <p className="text-blue-600">{job.ai_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

const DEFAULT_KEYWORDS = ['보험계리사', 'actuary', 'actuarial analyst']
const DEFAULT_LOCATIONS = ['Korea', 'Hong Kong', 'Singapore']

export default function AIImportPage() {
  // Search config
  const [keywords, setKeywords]     = useState(DEFAULT_KEYWORDS.join(', '))
  const [locations, setLocations]   = useState(DEFAULT_LOCATIONS.join(', '))
  const [maxJobs, setMaxJobs]       = useState(15)

  // Scraping state
  const [isSearching, setIsSearching] = useState(false)
  const [logs, setLogs]               = useState<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  // Job imports list
  const [jobs, setJobs]       = useState<JobImport[]>([])
  const [tabStatus, setTabStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Edit modal
  const [editJob, setEditJob] = useState<JobImport | null>(null)

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Load jobs for current tab
  const loadJobs = useCallback(async (status: 'pending' | 'approved' | 'rejected') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/ai-import?status=${status}&limit=100`)
      if (res.ok) {
        const json = await res.json()
        setJobs(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadJobs(tabStatus) }, [tabStatus, loadJobs])

  // ── Start scraping ────────────────────────────────────────────────────

  const startScrape = async () => {
    setIsSearching(true)
    setLogs(['🚀 AI 채용공고 검색 시작...'])

    const config = {
      keywords: keywords.split(',').map(s => s.trim()).filter(Boolean),
      locations: locations.split(',').map(s => s.trim()).filter(Boolean),
      maxJobs,
    }

    try {
      const res = await fetch('/api/jobs/ai-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const err = await res.json()
        setLogs(l => [...l, `❌ 오류: ${err.error}`])
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event: ScrapeEvent = JSON.parse(line.slice(6))

            if (event.message) {
              setLogs(l => [...l, event.message!])
            }

            if (event.type === 'job_found') {
              // Add newly found job to top of list if we're on pending tab
              if (tabStatus === 'pending') {
                setJobs(prev => [
                  {
                    id: `temp-${Date.now()}`,
                    created_at: new Date().toISOString(),
                    approved_at: null,
                    approved_by: null,
                    job_id: null,
                    ...event.job!,
                  } as JobImport,
                  ...prev,
                ])
              }
            }

            if (event.type === 'done' || event.type === 'error') {
              // Reload fresh from DB to get real IDs
              setTimeout(() => loadJobs(tabStatus), 1000)
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setLogs(l => [...l, `❌ 네트워크 오류: ${err instanceof Error ? err.message : String(err)}`])
    } finally {
      setIsSearching(false)
    }
  }

  // ── Approve / Reject / Delete ─────────────────────────────────────────

  const handleAction = async (
    id: string,
    action: 'approve' | 'reject',
    edits?: Partial<JobImport>,
  ) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/jobs/ai-import', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, edits }),
      })
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id))
        setEditJob(null)
      } else {
        const err = await res.json()
        alert(`오류: ${err.error}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 임포트를 영구 삭제하시겠습니까?')) return
    setLoadingId(id)
    try {
      await fetch(`/api/jobs/ai-import?id=${id}`, { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== id))
    } finally {
      setLoadingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  const pendingCount = jobs.filter(j => j.status === 'pending').length

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI 채용공고 자동 수집
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Claude AI가 주요 채용 사이트를 검색해 계리사 채용공고를 자동 수집합니다.
            관리자가 검토 후 승인하면 채용공고 목록에 게시됩니다.
          </p>
        </div>

        {/* API Key warning */}
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 max-w-xs">
          <strong>필요:</strong> <code className="font-mono">ANTHROPIC_API_KEY</code> 환경변수 설정
        </div>
      </div>

      {/* Setup notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">⚙️ 최초 설정: Supabase 테이블 생성 필요</p>
        <p className="text-xs text-blue-600">
          아직 <code className="font-mono bg-blue-100 px-1 rounded">job_imports</code> 테이블이 없다면
          Supabase Dashboard → SQL Editor에서{' '}
          <code className="font-mono bg-blue-100 px-1 rounded">supabase/migrations/20260311_create_job_imports.sql</code>을 실행해주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── Left: Search Config ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">검색 설정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  검색 키워드 (쉼표로 구분)
                </label>
                <textarea
                  rows={3}
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  disabled={isSearching}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  검색 지역 (쉼표로 구분)
                </label>
                <input
                  value={locations}
                  onChange={e => setLocations(e.target.value)}
                  disabled={isSearching}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">예: Korea, Hong Kong, Singapore</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  목표 수집 건수 (최대 50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxJobs}
                  onChange={e => setMaxJobs(parseInt(e.target.value) || 15)}
                  disabled={isSearching}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:opacity-50"
                />
              </div>

              <button
                onClick={startScrape}
                disabled={isSearching}
                className="w-full py-2.5 text-sm font-semibold bg-[#2563EB] text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    AI 검색 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    AI 검색 시작
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Sources */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">검색 대상 사이트</h3>
            <div className="space-y-2">
              {[
                { flag: '🇰🇷', sites: ['사람인', '잡코리아', 'LinkedIn KR'], priority: '우선순위 1' },
                { flag: '🇭🇰', sites: ['LinkedIn HK', 'JobsDB HK', 'eFinancialCareers HK'], priority: '우선순위 2' },
                { flag: '🇸🇬', sites: ['LinkedIn SG', 'JobsDB SG', 'eFinancialCareers SG'], priority: '우선순위 3' },
              ].map(row => (
                <div key={row.priority} className="flex items-start gap-2">
                  <span className="text-base">{row.flag}</span>
                  <div>
                    <p className="text-xs text-gray-400">{row.priority}</p>
                    <p className="text-xs text-gray-600">{row.sites.join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">사용 AI 모델</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-xs text-gray-600">Claude Sonnet 4.6</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Web Search + Web Fetch 툴 내장<br />
              분야 자동 분류 · 한국어/영어 지원
            </p>
          </div>
        </div>

        {/* ── Right: Log + Jobs table ─────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Live log */}
          {(isSearching || logs.length > 0) && (
            <div className="bg-[#0B1F3A] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Live Log</p>
                {isSearching && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    검색 중
                  </span>
                )}
              </div>
              <div className="h-40 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-white/80 leading-relaxed">{log}</p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(['pending', 'approved', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTabStatus(s)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${
                    tabStatus === s
                      ? 'bg-white text-[#2563EB] border-b-2 border-[#2563EB]'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {s === 'pending' ? '검토 대기' : s === 'approved' ? '승인됨' : '거절됨'}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-[#2563EB] text-white rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => loadJobs(tabStatus)}
                className="px-4 text-gray-400 hover:text-gray-600"
                title="새로고침"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Jobs table */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                <svg className="animate-spin w-5 h-5 mr-2 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                로딩 중...
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-10 h-10 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">
                  {tabStatus === 'pending'
                    ? '검토 대기 중인 공고가 없습니다. AI 검색을 시작해보세요.'
                    : `${tabStatus === 'approved' ? '승인된' : '거절된'} 공고가 없습니다.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      {['직책 / 회사', '지역', '보험권역', '직무분야', '출처', '상태', '액션'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-xs text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <JobRow
                        key={job.id}
                        job={job}
                        loading={loadingId === job.id}
                        onApprove={() => handleAction(job.id, 'approve')}
                        onEdit={() => setEditJob(job)}
                        onReject={() => handleAction(job.id, 'reject')}
                        onDelete={() => handleDelete(job.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editJob && (
        <EditModal
          job={editJob}
          onClose={() => setEditJob(null)}
          onSave={edits => handleAction(editJob.id, 'approve', edits)}
        />
      )}
    </div>
  )
}
