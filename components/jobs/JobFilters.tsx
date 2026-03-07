'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

interface Filters {
  q?: string
  main?: string   // comma-separated
  detail?: string // comma-separated
  exp?: string    // comma-separated
  type?: string   // comma-separated
}

const DETAIL_PREVIEW_COUNT = 5

export default function JobFilters({
  current,
  mainOptions = [...MAIN_SPECIALIZATIONS],
  detailOptions = [...DETAILED_SPECIALTIES],
}: {
  current: Filters
  mainOptions?: string[]
  detailOptions?: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(current.q ?? '')
  const [detailExpanded, setDetailExpanded] = useState(false)

  const selectedMain = current.main ? current.main.split(',').filter(Boolean) : []
  const selectedDetail = current.detail ? current.detail.split(',').filter(Boolean) : []
  const selectedExp = current.exp ? current.exp.split(',').filter(Boolean) : []
  const selectedType = current.type ? current.type.split(',').filter(Boolean) : []

  function navigate(overrides: Record<string, string | null>) {
    const merged: Record<string, string> = {}
    ;(Object.entries({ ...current, ...overrides }) as [string, string | null][]).forEach(
      ([k, v]) => {
        if (v) merged[k] = v
      }
    )
    const qs = new URLSearchParams(merged).toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  function toggleValue(key: string, selected: string[], value: string) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    navigate({ [key]: next.length ? next.join(',') : null })
  }

  const hasFilters = !!(current.q || current.main || current.detail || current.exp || current.type)

  return (
    <div className="space-y-3 mb-6">
      {/* Keyword search */}
      <form
        onSubmit={e => {
          e.preventDefault()
          navigate({ q: keyword.trim() || null })
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="직무명, 회사명으로 검색"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          검색
        </button>
      </form>

      {/* Inline chip filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <FilterRow
          label="분야"
          options={mainOptions}
          selected={selectedMain}
          onToggle={v => toggleValue('main', selectedMain, v)}
        />
        <FilterRow
          label="세부전문"
          options={detailExpanded ? detailOptions : detailOptions.slice(0, DETAIL_PREVIEW_COUNT)}
          selected={selectedDetail}
          onToggle={v => toggleValue('detail', selectedDetail, v)}
          expandButton={
            detailOptions.length > DETAIL_PREVIEW_COUNT ? (
              <button
                type="button"
                onClick={() => setDetailExpanded(v => !v)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                {detailExpanded ? '접기 ▲' : `+${detailOptions.length - DETAIL_PREVIEW_COUNT}개 더보기 ▼`}
              </button>
            ) : undefined
          }
        />
        <FilterRow
          label="경력"
          options={[...EXPERIENCE_LEVELS]}
          selected={selectedExp}
          onToggle={v => toggleValue('exp', selectedExp, v)}
        />
        <FilterRow
          label="고용형태"
          options={[...EMPLOYMENT_TYPES]}
          selected={selectedType}
          onToggle={v => toggleValue('type', selectedType, v)}
        />
        {hasFilters && (
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                startTransition(() => router.push(pathname))
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterRow({
  label,
  options,
  selected,
  onToggle,
  expandButton,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  expandButton?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs font-semibold text-gray-500 w-14 flex-shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => {
          const active = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {o}
            </button>
          )
        })}
        {expandButton}
      </div>
    </div>
  )
}
