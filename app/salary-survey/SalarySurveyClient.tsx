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

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ── Left: Filter Panel ──────────────────────────────────────── */}
      <div className="w-full lg:w-64 shrink-0">
        <SalarySurveyFilters filters={filters} onChange={setFilters} />
      </div>

      {/* ── Right: Chart + Cards ──────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* KPI Cards */}
        <SalarySurveySummaryCards summary={summary} />

        {/* Active filter tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-400 mr-1">적용 필터:</span>
            {activeTags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
              >
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Notes</h3>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="flex gap-2">
              <span className="text-[#2563EB] font-bold shrink-0">•</span>
              <span>
                <strong className="text-gray-700">Median vs Average:</strong>{' '}
                연봉 분포는 상위 소득자 영향으로 Average가 Median보다 높게 나타나는 경향이 있습니다.
                왜곡 없는 비교를 위해 Median 기준을 권장합니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#2563EB] font-bold shrink-0">•</span>
              <span>
                <strong className="text-gray-700">Sample Size:</strong>{' '}
                특정 조합의 응답 수가 5명 미만인 경우 통계적 신뢰도가 낮을 수 있으며, 해당 구간 수치는 참고용으로만 활용해 주세요.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#2563EB] font-bold shrink-0">•</span>
              <span>
                <strong className="text-gray-700">Total Comp 기준:</strong>{' '}
                Base Salary + 연간 보너스(성과급 포함) 기준이며, 주식(RSU/ESOP) 및 기타 장기 인센티브는 포함하지 않습니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#2563EB] font-bold shrink-0">•</span>
              <span>
                <strong className="text-gray-700">데이터 출처:</strong>{' '}
                본 데이터는 Finquara Salary Survey {filters.surveyYear.join(', ')} 설문 응답 기준으로 집계된 방향성 추정치입니다.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
