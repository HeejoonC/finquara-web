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
  // 색 대신 채움(대기) / 윤곽(처리됨)으로 상태를 구분한다
  const map = {
    pending:  'tag tag-solid',
    approved: 'tag',
    rejected: 'tag opacity-60',
  }
  const labels = { pending: '검토 대기', approved: '승인됨', rejected: '거절됨' }
  return <span className={map[status]}>{labels[status]}</span>
}

function SiteChip({ site }: { site: string | null }) {
  if (!site) return null
  return <span className="tag">{site}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(17,17,17,0.45)]">
      <div className="bg-bg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">공고 수정 후 승인</h2>
          <button onClick={onClose} className="text-muted hover:text-ink p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">직책명 *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="field-box"
              />
            </div>
            <div>
              <label className="form-label">회사명 *</label>
              <input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="field-box"
              />
            </div>
          </div>

          {/* Location & Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">지역</label>
              <input
                value={form.location ?? ''}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="field-box"
              />
            </div>
            <div>
              <label className="form-label">경력</label>
              <select
                value={form.experience_level ?? ''}
                onChange={e => setForm(f => ({ ...f, experience_level: e.target.value as JobImport['experience_level'] }))}
                className="field-box"
              >
                <option value="">선택</option>
                {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Employment type & Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">고용형태</label>
              <select
                value={form.employment_type ?? ''}
                onChange={e => setForm(f => ({ ...f, employment_type: e.target.value as JobImport['employment_type'] }))}
                className="field-box"
              >
                <option value="">선택</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">급여</label>
              <input
                value={form.salary_range ?? ''}
                onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))}
                placeholder="예: 6,000~9,000만원 / 협의"
                className="field-box"
              />
            </div>
          </div>

          {/* Main specializations */}
          <div>
            <label className="form-label">보험권역</label>
            <div className="flex flex-wrap gap-1.5">
              {MAIN_SPECIALIZATIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, main_specializations: toggle(f.main_specializations, s) as JobImport['main_specializations'] }))}
                  className={`px-2.5 py-1  text-xs font-medium transition-colors ${
                    form.main_specializations.includes(s)
                      ? 'chip-active' : ''
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed specialties */}
          <div>
            <label className="form-label">직무분야</label>
            <div className="flex flex-wrap gap-1.5">
              {DETAILED_SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, detailed_specialties: toggle(f.detailed_specialties, s) as JobImport['detailed_specialties'] }))}
                  className={`px-2.5 py-1  text-xs font-medium transition-colors ${
                    form.detailed_specialties.includes(s)
                      ? 'chip-active' : ''
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Apply URL */}
          <div>
            <label className="form-label">지원 링크</label>
            <input
              value={form.apply_url ?? ''}
              onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
              className="field-box"
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">공고 내용</label>
            <textarea
              rows={6}
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="field-box resize-none"
            />
          </div>

          {/* AI Notes (read-only) */}
          {job.ai_notes && (
            <div className="bg-bg-strong border border-line p-3">
              <p className="text-xs font-medium text-ink mb-1">AI 분류 메모</p>
              <p className="text-xs text-ink">{job.ai_notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-line">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-soft border border-line hover:bg-bg-strong"
          >
            취소
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 text-sm font-medium bg-ink text-bg hover:opacity-90"
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
      <tr className="border-b border-line transition-colors hover:bg-bg-strong">
        <td className="px-4 py-4">
          <div className="flex items-start gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-muted hover:text-ink shrink-0"
            >
              <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <p className="h4 text-[1rem]">{job.title}</p>
              <p className="body-sm mt-1 text-[0.82rem]">{job.company}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <p className="text-xs text-ink-soft">{job.location || '—'}</p>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {job.main_specializations?.slice(0, 2).map(s => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1">
            {job.detailed_specialties?.slice(0, 2).map(s => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-4">
          <SiteChip site={job.source_site} />
        </td>
        <td className="px-4 py-4">
          <StatusBadge status={job.status} />
        </td>
        <td className="px-4 py-4 text-right">
          {job.status === 'pending' ? (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onApprove}
                disabled={loading}
                title="바로 승인 (채용공고 생성)"
                className="btn btn-sm"
              >
                승인
              </button>
              <button
                onClick={onEdit}
                disabled={loading}
                title="수정 후 승인"
                className="btn btn-ghost btn-sm"
              >
                수정
              </button>
              <button
                onClick={onReject}
                disabled={loading}
                title="거절"
                className="btn-text"
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
                  className="label-sm link"
                >
                  공고 보기 →
                </Link>
              )}
              <button
                onClick={onDelete}
                className="btn-text"
              >
                삭제
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-bg-strong">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-ink mb-1">공고 내용</p>
                <p className="text-ink-soft whitespace-pre-wrap leading-relaxed">
                  {job.description || '(내용 없음)'}
                </p>
              </div>
              <div className="space-y-2">
                {job.salary_range && (
                  <div>
                    <span className="font-medium text-ink">급여: </span>
                    <span className="text-ink-soft">{job.salary_range}</span>
                  </div>
                )}
                {job.experience_level && (
                  <div>
                    <span className="font-medium text-ink">경력: </span>
                    <span className="text-ink-soft">{job.experience_level}</span>
                  </div>
                )}
                {job.employment_type && (
                  <div>
                    <span className="font-medium text-ink">고용형태: </span>
                    <span className="text-ink-soft">{job.employment_type}</span>
                  </div>
                )}
                {job.apply_url && (
                  <div>
                    <span className="font-medium text-ink">지원링크: </span>
                    <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                      className="text-ink hover:underline break-all"
                    >
                      {job.apply_url}
                    </a>
                  </div>
                )}
                {job.source_url && job.source_url !== job.apply_url && (
                  <div>
                    <span className="font-medium text-ink">출처: </span>
                    <a href={job.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-ink-soft hover:underline break-all"
                    >
                      {job.source_url}
                    </a>
                  </div>
                )}
                {job.ai_notes && (
                  <div className="mt-2 p-2 bg-bg-strong border border-line">
                    <p className="font-medium text-ink mb-0.5">AI 메모</p>
                    <p className="text-ink">{job.ai_notes}</p>
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
  const [autoUpload, setAutoUpload] = useState(true)
  const [autoPublish, setAutoPublish] = useState(false)

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
      autoUpload,
      autoPublish: autoUpload && autoPublish,
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

            if (event.type === 'job_found' && event.job) {
              // 저장된 공고를 현재 탭과 상태가 맞을 때만 낙관적으로 끼워 넣는다
              const incoming = event.job
              if (incoming.status === tabStatus) {
                setJobs(prev => [
                  {
                    id: `temp-${Date.now()}-${prev.length}`,
                    created_at: new Date().toISOString(),
                    approved_at: null,
                    approved_by: null,
                    job_id: null,
                    ...incoming,
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
    <div className="container space-y-14">

      {/* Header */}
      <header className="grid grid-cols-[1.4fr_1fr] items-end gap-x-16 gap-y-8 border-b border-line-strong pb-12 fold-980">
        <div>
          <p className="label-sm">Admin / AI Import</p>
          <h1 className="h2 mt-6">Auto-collect.</h1>
          <p className="body mt-6 max-w-[52ch]">
            AI가 주요 채용 사이트를 검색해 계리사 공고를 수집하고 목록에 등록합니다. 중복은
            자동으로 걸러집니다.
          </p>
        </div>

        {/* 환경변수 안내 */}
        <div className="notice-quiet">
          <span className="font-semibold text-ink">필요한 환경변수</span>
          <br />
          <code className="font-mono">OPENROUTER_API_KEY</code>,{' '}
          <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code>
        </div>
      </header>

      {/* Setup notice */}
      <div className="notice space-y-4">
        <div>
          <p className="font-medium mb-1">최초 설정: Supabase 마이그레이션 실행</p>
          <p className="text-xs text-ink">
            Supabase Dashboard → SQL Editor에서{' '}
            <code className="font-mono bg-bg-strong px-1">supabase/migrations/20260311_create_job_imports.sql</code>과{' '}
            <code className="font-mono bg-bg-strong px-1">supabase/migrations/v6_job_imports_dedup.sql</code>을 실행해주세요.
          </p>
        </div>
        <div className="pt-2 border-t border-line">
          <p className="font-medium mb-1">Claude Code 구독 토큰으로 돌리기</p>
          <p className="text-xs text-ink">
            이 페이지는 OpenRouter(DeepSeek)를 사용합니다. API 비용 없이 Claude Code 구독 토큰으로 수집하려면
            로컬 터미널에서 <code className="font-mono bg-bg-strong px-1">npm run scrape</code>를 실행하세요.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-5 xl:gap-16">

        {/* ── Left: Search Config ─────────────────────────────────── */}
        <div className="space-y-10 xl:col-span-2">
          <div className="border border-line-strong p-6">
            <h2 className="label-sm mb-6 block border-b border-line-strong pb-4">검색 설정</h2>

            <div className="space-y-4">
              <div>
                <label className="form-label">
                  검색 키워드 (쉼표로 구분)
                </label>
                <textarea
                  rows={3}
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  disabled={isSearching}
                  className="field-box resize-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="form-label">
                  검색 지역 (쉼표로 구분)
                </label>
                <input
                  value={locations}
                  onChange={e => setLocations(e.target.value)}
                  disabled={isSearching}
                  className="field-box disabled:opacity-50"
                />
                <p className="text-xs text-muted mt-1">예: Korea, Hong Kong, Singapore</p>
              </div>

              <div>
                <label className="form-label">
                  목표 수집 건수 (최대 50)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxJobs}
                  onChange={e => setMaxJobs(parseInt(e.target.value) || 15)}
                  disabled={isSearching}
                  className="field-box disabled:opacity-50"
                />
              </div>

              {/* 자동 업로드 설정 */}
              <div className="space-y-3 pt-1 border-t border-line">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpload}
                    onChange={e => setAutoUpload(e.target.checked)}
                    disabled={isSearching}
                    className="mt-0.5 accent-ink disabled:opacity-50"
                  />
                  <span>
                    <span className="block text-xs font-medium text-ink">채용공고에 자동 등록</span>
                    <span className="block text-xs text-muted">
                      끄면 검토 대기(pending)로만 저장되고 승인은 직접 해야 합니다.
                    </span>
                  </span>
                </label>

                <label className={`flex items-start gap-2 ${autoUpload ? 'cursor-pointer' : 'opacity-40'}`}>
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={e => setAutoPublish(e.target.checked)}
                    disabled={isSearching || !autoUpload}
                    className="mt-0.5 accent-ink disabled:opacity-50"
                  />
                  <span>
                    <span className="block text-xs font-medium text-ink">등록과 동시에 즉시 공개</span>
                    <span className="block text-xs text-muted">
                      기본값은 비공개입니다. 켜면 검토 없이 바로 사이트에 노출됩니다.
                    </span>
                  </span>
                </label>
              </div>

              <button
                onClick={startScrape}
                disabled={isSearching}
                className="btn w-full"
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
          <div className="border border-line-strong p-6">
            <h3 className="label-sm mb-5 block border-b border-line-strong pb-4">검색 대상 사이트</h3>
            <div className="space-y-2">
              {[
                { flag: 'KR', sites: ['사람인', '잡코리아', 'LinkedIn KR'], priority: '우선순위 1' },
                { flag: 'HK', sites: ['LinkedIn HK', 'JobsDB HK', 'eFinancialCareers HK'], priority: '우선순위 2' },
                { flag: 'SG', sites: ['LinkedIn SG', 'JobsDB SG', 'eFinancialCareers SG'], priority: '우선순위 3' },
              ].map(row => (
                <div key={row.priority} className="flex items-start gap-2">
                  <span className="num w-7 shrink-0">{row.flag}</span>
                  <div>
                    <p className="text-xs text-muted">{row.priority}</p>
                    <p className="text-xs text-ink-soft">{row.sites.join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model info */}
          <div className="border border-line-strong p-6">
            <h3 className="label-sm mb-4 block border-b border-line-strong pb-4">사용 AI 모델</h3>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-ink" />
              <span className="text-xs text-ink-soft">DeepSeek V3.2 (OpenRouter)</span>
            </div>
            <p className="text-xs text-muted mt-1">
              웹 검색 + 페이지 열람 + 자동 분류<br />
              한국어/영어 지원 · 저비용 운영
            </p>
            <div className="mt-3 pt-3 border-t border-line flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-line-strong" />
              <span className="text-xs text-ink-soft">로컬: Claude Sonnet 5 (구독 토큰)</span>
            </div>
            <p className="text-xs text-muted mt-1">
              <code className="font-mono">npm run scrape</code> 실행 시 사용
            </p>
          </div>
        </div>

        {/* ── Right: Log + Jobs table ─────────────────────────────── */}
        <div className="space-y-10 xl:col-span-3">

          {/* Live log */}
          {(isSearching || logs.length > 0) && (
            <div className="bg-ink p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-bg/70 uppercase tracking-wide">Live Log</p>
                {isSearching && (
                  <span className="flex items-center gap-1.5 text-xs text-bg">
                    <span className="w-1.5 h-1.5 bg-bg" />
                    검색 중
                  </span>
                )}
              </div>
              <div className="h-40 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-bg/80 leading-relaxed">{log}</p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div>
            <div className="flex items-center border-b border-line-strong">
              {(['pending', 'approved', 'rejected'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTabStatus(s)}
                  className={`flex-1 border-b-2 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
                    tabStatus === s
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {s === 'pending' ? '검토 대기' : s === 'approved' ? '승인됨' : '거절됨'}
                  {s === 'pending' && pendingCount > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[0.62rem] text-bg">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => loadJobs(tabStatus)}
                className="px-4 py-4 text-muted transition-colors hover:text-ink"
                title="새로고침"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Jobs table */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted">
                <svg className="animate-spin w-5 h-5 mr-2 text-ink" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                로딩 중...
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted">
                <svg className="w-10 h-10 mb-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <thead>
                    <tr className="table-head">
                      {['직책 / 회사', '지역', '보험권역', '직무분야', '출처', '상태', '액션'].map(h => (
                        <th key={h} className="px-4 py-4 font-semibold">{h}</th>
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
