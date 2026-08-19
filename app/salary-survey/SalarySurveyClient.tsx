'use client'

import { useState, useMemo } from 'react'
import SalarySurveyFilters from '@/components/salary-survey/SalarySurveyFilters'
import SalarySurveyChart from '@/components/salary-survey/SalarySurveyChart'
import SalarySurveySummaryCards from '@/components/salary-survey/SalarySurveySummaryCards'
import { SURVEY_MOCK_DATA } from '@/lib/salary-survey/mockData'
import {
  DEFAULT_FILTERS,
  applyFilters,
  aggregateByBucket,
  computeSummary,
} from '@/lib/salary-survey/utils'
import type { SurveyFilters } from '@/lib/salary-survey/utils'

export default function SalarySurveyClient() {
  const [filters, setFilters] = useState<SurveyFilters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => applyFilters(SURVEY_MOCK_DATA, filters), [filters])
  const chartData = useMemo(() => aggregateByBucket(filtered, filters), [filtered, filters])
  const summary   = useMemo(() => computeSummary(filtered), [filtered])

  // Active filter badge summary for the chart header
  const activeTags: string[] = [
    ...filters.industry,
    ...filters.function,
    ...filters.location,
    ...filters.credential,
    ...filters.companyType,
  ]

  const notes: { term: string; body: string }[] = [
    {
      term: 'Median vs Average',
      body: '연봉 분포는 상위 소득자 영향으로 Average가 Median보다 높게 나타나는 경향이 있습니다. 왜곡 없는 비교를 위해 Median 기준을 권장합니다.',
    },
    {
      term: 'Sample Size',
      body: '특정 조합의 응답 수가 5명 미만인 경우 통계적 신뢰도가 낮을 수 있으며, 해당 구간 수치는 참고용으로만 활용해 주세요.',
    },
    {
      term: 'Total Comp',
      body: 'Base Salary + 연간 보너스(성과급 포함) 기준이며, 주식(RSU/ESOP) 및 기타 장기 인센티브는 포함하지 않습니다.',
    },
    {
      term: 'Source',
      body: `본 데이터는 Finquara Salary Survey ${filters.surveyYear.join(', ')} 설문 응답 기준으로 집계된 방향성 추정치입니다.`,
    },
  ]

  return (
    <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
      {/* ── Left: Filter Panel ──────────────────────────────────────── */}
      <div className="w-full shrink-0 lg:w-64">
        <SalarySurveyFilters filters={filters} onChange={setFilters} />
      </div>

      {/* ── Right: Chart + Cards ──────────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-12">
        {/* KPI Cards */}
        <SalarySurveySummaryCards summary={summary} />

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-sm mr-2">Active</span>
            {activeTags.map(tag => (
              <span key={tag} className="tag tag-solid">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Main Chart */}
        <SalarySurveyChart
          data={chartData}
          metric={filters.metric}
          compensation={filters.compensation}
          showP25P75={filters.showP25P75}
        />

        {/* Insights Panel */}
        <div className="border-t border-line-strong pt-8">
          <p className="label-sm">Data Notes</p>
          <ul className="mt-6">
            {notes.map(n => (
              <li
                key={n.term}
                className="grid grid-cols-[10rem_1fr] gap-x-8 gap-y-2 border-b border-line py-5 fold-720"
              >
                <span className="label-sm">{n.term}</span>
                <span className="body-sm">{n.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
