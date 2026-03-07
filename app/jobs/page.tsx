import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobFilters from '@/components/jobs/JobFilters'
import JobListItem from '@/components/jobs/JobListItem'
import type { Job } from '@/types/database'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

type SearchParams = Promise<{
  q?: string
  main?: string
  detail?: string
  exp?: string
  type?: string
}>

// Parse experience string into a comparable range
// Handles: "신입", "경력무관", "경력 5~7년" (from job form), "5~8년" (from filter chips), "20년 초과"
function parseExpRange(val: string): { min: number; max: number } | 'fresh' | 'any' | null {
  if (!val) return null
  const v = val.trim()
  if (v === '신입') return 'fresh'
  if (v === '경력무관') return 'any'
  if (v === '20년 초과') return { min: 20, max: Infinity }
  if (v === '경력') return { min: 0, max: Infinity }

  // "경력 5~7년" format (from job posting form)
  const m1 = v.match(/^경력\s*(\d+)\s*~\s*(\d+)년?$/)
  if (m1) return { min: parseInt(m1[1]), max: parseInt(m1[2]) }

  // "5~8년" format (from filter chips)
  const m2 = v.match(/^(\d+)~(\d+)년$/)
  if (m2) return { min: parseInt(m2[1]), max: parseInt(m2[2]) }

  return null
}

// Check if a job's experience level matches any of the selected filter values
// Uses range overlap: job range [a,b] overlaps filter range [c,d] when a<=d && c<=b
function expMatches(jobLevel: string | null, filterVals: string[]): boolean {
  if (!filterVals.length) return true
  if (!jobLevel) return false

  const jobRange = parseExpRange(jobLevel)
  if (!jobRange) return false

  return filterVals.some(filterVal => {
    const filterRange = parseExpRange(filterVal)
    if (!filterRange) return false

    if (filterRange === 'fresh') return jobRange === 'fresh'
    if (jobRange === 'any') return true          // 경력무관은 모든 경력 필터에 매칭
    if (jobRange === 'fresh') return false       // 신입은 신입 필터에만 매칭
    if (filterRange === 'any') return true

    // 범위 겹침 확인
    return jobRange.min <= filterRange.max && filterRange.min <= jobRange.max
  })
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  let canPost = false
  try {
    const { data: { user } } = await supabase.auth.getUser()
    canPost = !!user
  } catch {
    // ignore
  }

  // Fetch taxonomy from DB (fall back to constants if table not ready)
  let mainOptions = [...MAIN_SPECIALIZATIONS] as string[]
  let detailOptions = [...DETAILED_SPECIALTIES] as string[]
  try {
    const { data: taxItems } = await supabase
      .from('taxonomy_items')
      .select('type, label')
      .order('sort_order')
    if (taxItems?.length) {
      const m = taxItems.filter(t => t.type === 'main').map(t => t.label)
      const d = taxItems.filter(t => t.type === 'detail').map(t => t.label)
      if (m.length) mainOptions = m
      if (d.length) detailOptions = d
    }
  } catch { /* ignore */ }

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,company.ilike.%${params.q}%`)
  }
  if (params.main) {
    const vals = params.main.split(',').filter(Boolean)
    if (vals.length === 1) {
      query = query.contains('main_specializations', vals)
    } else {
      query = query.overlaps('main_specializations', vals)
    }
  }
  if (params.detail) {
    const vals = params.detail.split(',').filter(Boolean)
    if (vals.length === 1) {
      query = query.contains('detailed_specialties', vals)
    } else {
      query = query.overlaps('detailed_specialties', vals)
    }
  }
  // 경력 필터는 범위 겹침 로직이 필요하여 DB 필터 대신 JS에서 처리
  if (params.type) {
    const vals = params.type.split(',').filter(Boolean)
    if (vals.length === 1) {
      query = query.eq('employment_type', vals[0])
    } else {
      query = query.in('employment_type', vals)
    }
  }

  const { data: allJobs } = await query

  // 경력 범위 겹침 필터 (JS)
  const expFilterVals = params.exp ? params.exp.split(',').filter(Boolean) : []
  const jobs = expFilterVals.length
    ? (allJobs ?? []).filter((job: Job) => expMatches(job.experience_level, expFilterVals))
    : (allJobs ?? [])

  const hasActiveFilters = !!(params.q || params.main || params.detail || params.exp || params.type)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">채용공고</h1>
          <p className="text-gray-500 text-sm mt-1">계리·보험 분야 채용정보를 찾아보세요.</p>
        </div>
        {canPost && (
          <Link
            href="/post"
            className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
          >
            + 공고 등록
          </Link>
        )}
      </div>

      {/* Filters (client component) */}
      <JobFilters current={params} mainOptions={mainOptions} detailOptions={detailOptions} />

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-3">
        {hasActiveFilters && '필터 적용 중 · '}
        {jobs.length}개의 채용공고
      </p>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base mb-1">검색 결과가 없습니다.</p>
          <p className="text-sm">다른 검색어나 필터를 사용해 보세요.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* 테이블 헤더 (데스크톱만) */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-x-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>공고 제목 / 회사</span>
            <span>분야</span>
            <span>세부전문</span>
            <span>경력</span>
            <span>고용형태</span>
            <span className="text-right">등록자 / 등록일</span>
          </div>

          {/* 각 공고 행 */}
          <div className="divide-y divide-gray-100">
            {jobs.map((job: Job) => (
              <JobListItem key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
