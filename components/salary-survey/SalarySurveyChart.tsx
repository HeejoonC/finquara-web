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
} from 'recharts'
import type { BucketDataPoint } from '@/lib/salary-survey/utils'
import { formatKRW, formatKRWAxis } from '@/lib/salary-survey/utils'

/* 차트도 시스템 6색만 쓴다. 시리즈 구분은 색이 아니라 선 굵기·파선으로 한다. */
const INK = '#111111'
const MUTED = '#6d675f'
const LINE = 'rgba(17,17,17,0.1)'
const BG = '#f6f4f0'

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
  const p25 = payload.find(p => p.name === 'P25')
  const p75 = payload.find(p => p.name === 'P75')
  const count = payload.find(p => p.name === 'count')

  return (
    <div className="panel-float min-w-[220px] p-5">
      <p className="label-sm">{label}</p>
      <div className="mt-4 space-y-2">
        <TooltipRow label={`${metricLabel} ${compLabel}`} value={main ? formatKRW(main.value) : '—'} strong />
        {p25 && <TooltipRow label="P25" value={formatKRW(p25.value)} />}
        {p75 && <TooltipRow label="P75" value={formatKRW(p75.value)} />}
        {count && (
          <div className="mt-3 border-t border-line pt-3">
            <TooltipRow label="Sample" value={`${count.value}`} />
          </div>
        )}
      </div>
    </div>
  )
}

function TooltipRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="label-sm normal-case tracking-[0.08em]">{label}</span>
      <span
        className={`tabular-nums text-ink ${strong ? 'text-[1.05rem] font-semibold tracking-[-0.02em]' : 'text-[0.9rem]'}`}
      >
        {value}
      </span>
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
    <div className="border-t border-line-strong pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="label-sm">Chart</p>
          <h3 className="h3 mt-4">
            {metricLabel} {compLabel}
          </h3>
          <p className="body-sm mt-3">
            연차 구간별 {metricLabel === 'Median' ? '중앙값' : '평균'} 연봉
          </p>
        </div>
        {!hasData && <span className="label-sm">No data</span>}
      </div>

      <div className="mt-10">
        {!hasData ? (
          <div className="flex h-64 items-center border-t border-line">
            <p className="body">선택한 조건에 해당하는 데이터가 없습니다.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={INK} stopOpacity={0.09} />
                  <stop offset="95%" stopColor={INK} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 11, fill: MUTED, letterSpacing: '0.08em' }}
                axisLine={{ stroke: 'rgba(17,17,17,0.18)' }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                tickFormatter={formatKRWAxis}
                tick={{ fontSize: 11, fill: MUTED }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                content={<CustomTooltip compensation={compensation} metric={metric} />}
                cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: '2 3' }}
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
                    name="band"
                  />
                  <Line
                    type="monotone"
                    dataKey="p75"
                    stroke={MUTED}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                    name="P75"
                  />
                  <Line
                    type="monotone"
                    dataKey="p25"
                    stroke={MUTED}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                    name="P25"
                  />
                </>
              )}

              <Line
                type="monotone"
                dataKey="main"
                stroke={INK}
                strokeWidth={2}
                dot={{ r: 4, fill: INK, strokeWidth: 2, stroke: BG }}
                activeDot={{ r: 6, fill: INK, stroke: BG, strokeWidth: 2 }}
                connectNulls
                name="main"
              />

              {showP25P75 && (
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    paddingTop: 20,
                    color: MUTED,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                  formatter={value => (value === 'main' ? `${metricLabel} ${compLabel}` : value)}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footnote */}
      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-2 border-t border-line pt-6">
        <p className="label-sm normal-case tracking-[0.08em]">
          Directional estimates from survey-style aggregated data.
        </p>
        <p className="label-sm normal-case tracking-[0.08em]">
          Median과 Average는 분포 왜곡에 따라 차이가 클 수 있습니다.
        </p>
      </div>
    </div>
  )
}
