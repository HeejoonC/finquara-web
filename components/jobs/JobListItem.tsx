import Link from 'next/link'
import type { Job } from '@/types/database'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\.\s+/g, '.').replace(/\.$/, '')
}

export default function JobListItem({ job }: { job: Job }) {
  const mainTags = job.main_specializations?.length
    ? job.main_specializations
    : job.specialization
    ? [job.specialization]
    : []

  const detailTags: string[] = job.detailed_specialties ?? []

  return (
    <>
      {/* ── Desktop layout (md+): table row ── */}
      <Link
        href={`/jobs/${job.id}`}
        className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto] gap-x-4 px-5 py-4 items-center hover:bg-blue-50 transition-colors group"
      >
        {/* 제목 + 회사 */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors">
            {job.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
        </div>

        {/* 분야 */}
        <div className="min-w-0">
          {mainTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {mainTags.slice(0, 2).map(s => (
                <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100 whitespace-nowrap">
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
                <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                  {s}
                </span>
              ))}
              {detailTags.length > 2 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                  +{detailTags.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>

        {/* 경력 */}
        <div>
          <span className="text-sm text-gray-600">{job.experience_level || '-'}</span>
        </div>

        {/* 고용형태 */}
        <div>
          <span className="text-sm text-gray-600">{job.employment_type || '-'}</span>
        </div>

        {/* 등록자 / 등록일 */}
        <div className="text-right">
          <p className="text-xs text-gray-600 whitespace-nowrap">{job.company}</p>
          <p className="text-xs text-gray-400 whitespace-nowrap mt-0.5">{formatDate(job.created_at)}</p>
        </div>
      </Link>

      {/* ── Mobile layout (< md): card ── */}
      <div className="md:hidden px-4 py-3">
        {/* 줄 1: 공고 제목 */}
        <Link href={`/jobs/${job.id}`} className="group block mb-1.5">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors">
            {job.title}
          </p>
        </Link>

        {/* 줄 2: 분야 · 세부전문 · 경력 · 고용형태 · 등록일 */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {/* 분야: 1개만 표시 */}
          {mainTags.slice(0, 1).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100 whitespace-nowrap">
              {s}
            </span>
          ))}

          {/* 세부전문: 최대 2개 고정 표시 */}
          {detailTags.slice(0, 2).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
              {s}
            </span>
          ))}

          {/* 경력 */}
          {job.experience_level && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-500 whitespace-nowrap">{job.experience_level}</span>
            </>
          )}

          {/* 고용형태 */}
          {job.employment_type && (
            <>
              <span className="text-gray-300 text-xs">·</span>
              <span className="text-xs text-gray-500 whitespace-nowrap">{job.employment_type}</span>
            </>
          )}

          {/* 등록일 */}
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(job.created_at)}</span>
        </div>
      </div>
    </>
  )
}
