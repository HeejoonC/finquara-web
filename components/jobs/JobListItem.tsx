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
        className="row hidden grid-cols-[2.2fr_1fr_1.5fr_0.8fr_0.8fr_auto] items-center gap-x-6 border-b border-line py-6 md:grid"
      >
        {/* 제목 + 회사 */}
        <div className="min-w-0">
          <p className="h4 truncate">{job.title}</p>
          <p className="body-sm mt-1 truncate">{job.company}</p>
        </div>

        {/* 분야 */}
        <div className="min-w-0">
          {mainTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {mainTags.slice(0, 2).map(s => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span className="label-sm">—</span>
          )}
        </div>

        {/* 세부전문 */}
        <div className="min-w-0">
          {detailTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {detailTags.slice(0, 2).map(s => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
              {detailTags.length > 2 && (
                <span className="tag">+{detailTags.length - 2}</span>
              )}
            </div>
          ) : (
            <span className="label-sm">—</span>
          )}
        </div>

        {/* 경력 */}
        <div>
          <span className="body-sm">{job.experience_level || '—'}</span>
        </div>

        {/* 고용형태 */}
        <div>
          <span className="body-sm">{job.employment_type || '—'}</span>
        </div>

        {/* 등록일 */}
        <div className="text-right">
          <span className="num whitespace-nowrap">{formatDate(job.created_at)}</span>
        </div>
      </Link>

      {/* ── Mobile layout (< md): stacked row ── */}
      <Link
        href={`/jobs/${job.id}`}
        className="row block border-b border-line py-5 md:hidden"
      >
        <p className="h4">{job.title}</p>
        <p className="body-sm mt-1">{job.company}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {mainTags.slice(0, 1).map(s => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
          {detailTags.slice(0, 2).map(s => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {job.experience_level && (
            <span className="label-sm normal-case tracking-[0.1em]">
              {job.experience_level}
            </span>
          )}
          {job.employment_type && (
            <span className="label-sm normal-case tracking-[0.1em]">
              {job.employment_type}
            </span>
          )}
          <span className="num">{formatDate(job.created_at)}</span>
        </div>
      </Link>
    </>
  )
}
