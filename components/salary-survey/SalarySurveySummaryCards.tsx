'use client'

import type { SurveySummary } from '@/lib/salary-survey/utils'
import { formatKRW } from '@/lib/salary-survey/utils'

interface Props {
  summary: SurveySummary
}

interface KPICardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

function KPICard({ label, value, sub, highlight }: KPICardProps) {
  return (
    <div
      className={`flex flex-col justify-between gap-6 border-b border-r border-line-strong p-6 ${
        highlight ? 'ink-block' : ''
      }`}
    >
      <p className="label-sm">{label}</p>
      <div>
        <p className="text-[clamp(1.8rem,2.6vw,2.6rem)] font-bold leading-none tracking-[-0.05em] tabular-nums">
          {value}
        </p>
        {sub && <p className="body-sm mt-3 text-[0.82rem]">{sub}</p>}
      </div>
    </div>
  )
}

export default function SalarySurveySummaryCards({ summary }: Props) {
  const { medianBase, medianTotal, avgBonusRatio, sampleSize } = summary
  const noData = sampleSize === 0

  return (
    <div className="grid grid-cols-2 border-l border-t border-line-strong lg:grid-cols-4">
      <KPICard
        label="Median Base"
        value={noData ? '—' : formatKRW(medianBase, true)}
        sub={noData ? '필터 조건을 변경해보세요' : '연봉 중앙값'}
        highlight
      />
      <KPICard
        label="Median Total"
        value={noData ? '—' : formatKRW(medianTotal, true)}
        sub={noData ? '—' : '보너스 포함'}
      />
      <KPICard
        label="Avg Bonus"
        value={noData ? '—' : `${avgBonusRatio}%`}
        sub={noData ? '—' : 'Base 대비 평균 보너스'}
      />
      <KPICard
        label="Sample"
        value={noData ? '0' : `${sampleSize}`}
        sub={noData ? '조건에 맞는 데이터 없음' : '필터 적용 후 응답 수'}
      />
    </div>
  )
}
