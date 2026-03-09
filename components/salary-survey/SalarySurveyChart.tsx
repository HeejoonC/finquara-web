'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import type { BucketDataPoint } from '@/lib/salary-survey/utils'
import { formatKRW, formatKRWAxis } from '@/lib/salary-survey/utils'

interface Props {
  data: BucketDataPoint[]
  metric: 'average' | 'median'
  compensation: 'baseSalary' | 'totalComp'
  showP25P75: boolean
}

function CustomTooltip({ active, payload, label, compensation, metric }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
  compensation: 'baseSalary' | 'totalComp'
  metric: 'average' | 'median'
}) {
  if (!active || !payload?.length) return null

  const compLabel = compensation === 'baseSalary' ? 'Base Salary' : 'Total Comp'
  const metricLabel = metric === 'median' ? 'Median' : 'Average'
  const main = payload.find(p => p.name === 'main')
  const p25  = payload.find(p => p.name === 'p25p75')
  const count = payload.find(p => p.name === 'count')

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[200px]">
      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{label}</p>
      <div className="space-y-1.5">
        {main && (
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-600">{metricLabel} {compLabel}</span>
            <span className="text-sm font-semibold text-gray-900">{formatKRW(main.value)}</span>
          </div>
        )}
        {p25 && payload.find(p => p.name === 'p75') && (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">P25</span>
              <span className="text-sm font-medium text-gray-700">
                {formatKRW(payload.find(p => p.name === 'p25p75')?.value ?? 0)}
              </span>
            </div>
          </>
        )}
        {count && (
          <div className="border-t border-gray-100 pt-1.5 mt-1.5 flex justify-between gap-4">
            <span className="text-xs text-gray-400">Sample</span>
            <span className="text-xs text-gray-500">{count.value}명</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SalarySurveyChart({ data, metric, compensation, showP25P75 }: Props) {
  const hasData = data.some(d => d.value > 0)

  const chartData = data.map(d => ({
    bucket: d.bucket,
    main:   d.value || undefined,
    p25:    showP25P75 && d.count > 0 ? d.p25 : undefined,
    p75:    showP25P75 && d.count > 0 ? d.p75 : undefined,
    count:  d.count,
  }))

  const compLabel = compensation === 'baseSalary' ? 'Base Salary' : 'Total Comp'
  const metricLabel = metric === 'median' ? 'Median' : 'Average'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">
          {metricLabel} {compLabel} by Experience
        </h3>
        {!hasData && (
          <span className="text-xs text-gray-400">데이터 없음</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-6">연차 구간별 {metricLabel === 'Median' ? '중앙값' : '평균'} 연봉</p>

      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          선택한 조건에 해당하는 데이터가 없습니다.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
            <defs>
              <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatKRWAxis}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<CustomTooltip compensation={compensation} metric={metric} />}
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
            />

            {showP25P75 && (
              <>
                <Area
                  type="monotone"
                  dataKey="p75"
                  stroke="none"
                  fill="url(#bandGradient)"
                  connectNulls
                  dot={false}
                  activeDot={false}
                  legendType="none"
                  name="p75"
                />
                <Line
                  type="monotone"
                  dataKey="p75"
                  stroke="#93c5fd"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                  name="P75"
                />
                <Line
                  type="monotone"
                  dataKey="p25"
                  stroke="#93c5fd"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                  name="P25"
                />
              </>
            )}

            <Line
              type="monotone"
              dataKey="main"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              name="main"
            />

            {showP25P75 && (
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16, color: '#94a3b8' }}
                formatter={(value) => {
                  if (value === 'main') return `${metricLabel} ${compLabel}`
                  return value
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Footnote */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
        <p className="text-xs text-gray-400">
          * Salary figures are directional estimates based on survey-style aggregated data.
        </p>
        <p className="text-xs text-gray-400">
          * Median과 Average는 왜곡 데이터에 따라 차이가 클 수 있습니다.
        </p>
      </div>
    </div>
  )
}
