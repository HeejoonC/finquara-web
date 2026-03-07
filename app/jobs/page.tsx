import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobFilters from '@/components/jobs/JobFilters'
import type { Job } from '@/types/database'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

type SearchParams = Promise<{
  q?: string
  main?: string
  detail?: string
  exp?: string
  type?: string
}>

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return '오늘'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  // Show post button to any logged-in user
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
  if (params.exp) {
    const vals = params.exp.split(',').filter(Boolean)
    if (vals.length === 1) {
      query = query.eq('experience_level', vals[0])
    } else {
      query = query.in('experience_level', vals)
    }
  }
  if (params.type) {
    const vals = params.type.split(',').filter(Boolean)
    if (vals.length === 1) {
      query = query.eq('employment_type', vals[0])
    } else {
      query = query.in('employment_type', vals)
    }
  }

  const { data: jobs } = await query

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
        {jobs?.length ?? 0}개의 채용공고
      </p>

      {/* Job table */}
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base mb-1">검색 결과가 없습니다.</p>
          <p className="text-sm">다른 검색어나 필터를 사용해 보세요.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-x-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>공고 제목 / 회사</span>
            <span>분야</span>
            <span>세부전문</span>
            <span>경력</span>
            <span>고용형태</span>
            <span className="text-right">등록자 / 등록일</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {jobs.map((job: Job) => {
              const mainTags = job.main_specializations ?? []
              const displayMain = mainTags.length
                ? mainTags
                : job.specialization
                ? [job.specialization]
                : []

              const detailTags: string[] = job.detailed_specialties ?? []

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-x-4 px-5 py-4 items-center hover:bg-blue-50 transition-colors group"
                >
                  {/* Title + company */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.company}</p>
                  </div>

                  {/* 분야 */}
                  <div className="min-w-0">
                    {displayMain.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {displayMain.slice(0, 2).map(s => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100 whitespace-nowrap"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>

                  {/* 세부전문 */}
                  <div className="min-w-0">
                    {detailTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {detailTags.slice(0, 2).map(s => (
                          <span
                            key={s}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>

                  {/* 경력 */}
                  <div>
                    <span className="text-sm text-gray-600">
                      {job.experience_level || '-'}
                    </span>
                  </div>

                  {/* 고용형태 */}
                  <div>
                    <span className="text-sm text-gray-600">
                      {job.employment_type || '-'}
                    </span>
                  </div>

                  {/* 등록자 / 등록일 */}
                  <div className="text-right">
                    <p className="text-xs text-gray-600 whitespace-nowrap">{job.company}</p>
                    <p className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{formatDate(job.created_at)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
