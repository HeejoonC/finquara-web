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
      className={`rounded-xl border px-5 py-4 flex flex-col gap-1 ${
        highlight
          ? 'bg-[#2563EB] border-[#2563EB] text-white'
          : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <p className={`text-xs font-medium tracking-wide uppercase ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold leading-none ${highlight ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-0.5 ${highlight ? 'text-blue-100' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function SalarySurveySummaryCards({ summary }: Props) {
  const { medianBase, medianTotal, avgBonusRatio, sampleSize } = summary
  const noData = sampleSize === 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        label="Median Base Salary"
        value={noData ? '—' : formatKRW(medianBase, true)}
        sub={noData ? '필터 조건을 변경해보세요' : '연봉 중앙값'}
        highlight
      />
      <KPICard
        label="Median Total Comp"
        value={noData ? '—' : formatKRW(medianTotal, true)}
        sub={noData ? '—' : '보너스 포함'}
      />
      <KPICard
        label="Avg Bonus Ratio"
        value={noData ? '—' : `${avgBonusRatio}%`}
        sub={noData ? '—' : 'Base 대비 평균 보너스'}
      />
      <KPICard
        label="Sample Size"
        value={noData ? '0' : `${sampleSize}명`}
        sub={noData ? '조건에 맞는 데이터 없음' : '필터 적용 후 응답 수'}
      />
    </div>
  )
}
