'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
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

export default function JobFilters({ current }: { current: Filters }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(current.q ?? '')

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
  const allChips: { label: string; key: string; selected: string[]; value: string }[] = [
    ...selectedMain.map(v => ({ label: v, key: 'main', selected: selectedMain, value: v })),
    ...selectedDetail.map(v => ({ label: v, key: 'detail', selected: selectedDetail, value: v })),
    ...selectedExp.map(v => ({ label: v, key: 'exp', selected: selectedExp, value: v })),
    ...selectedType.map(v => ({ label: v, key: 'type', selected: selectedType, value: v })),
  ]

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

      {/* Multi-select filter dropdowns */}
      <div className="flex flex-wrap gap-2 items-center">
        <MultiSelect
          label="분야"
          options={[...MAIN_SPECIALIZATIONS]}
          selected={selectedMain}
          onToggle={v => toggleValue('main', selectedMain, v)}
          onClear={() => navigate({ main: null })}
        />
        <MultiSelect
          label="세부 전문"
          options={[...DETAILED_SPECIALTIES]}
          selected={selectedDetail}
          onToggle={v => toggleValue('detail', selectedDetail, v)}
          onClear={() => navigate({ detail: null })}
        />
        <MultiSelect
          label="경력"
          options={[...EXPERIENCE_LEVELS]}
          selected={selectedExp}
          onToggle={v => toggleValue('exp', selectedExp, v)}
          onClear={() => navigate({ exp: null })}
        />
        <MultiSelect
          label="고용형태"
          options={[...EMPLOYMENT_TYPES]}
          selected={selectedType}
          onToggle={v => toggleValue('type', selectedType, v)}
          onClear={() => navigate({ type: null })}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setKeyword('')
              startTransition(() => router.push(pathname))
            }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {(hasFilters) && (
        <div className="flex flex-wrap gap-1.5">
          {current.q && (
            <ActiveChip
              label={`"${current.q}"`}
              onRemove={() => {
                setKeyword('')
                navigate({ q: null })
              }}
            />
          )}
          {allChips.map(({ label, key, selected, value }) => (
            <ActiveChip
              key={`${key}-${value}`}
              label={label}
              onRemove={() => toggleValue(key, selected, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = selected.length > 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${
          isActive
            ? 'border-[#2563EB] text-[#2563EB] bg-blue-50'
            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
        }`}
      >
        {label}
        {isActive && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
            {selected.length}
          </span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] max-h-64 overflow-y-auto py-1">
          {options.map(o => (
            <label
              key={o}
              className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => onToggle(o)}
                className="rounded accent-[#2563EB]"
              />
              {o}
            </label>
          ))}
          {isActive && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100 mt-1"
            >
              전체 해제
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#2563EB] text-xs rounded-full border border-blue-100">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label="필터 제거"
        className="ml-0.5 hover:text-blue-800 transition-colors leading-none"
      >
        ×
      </button>
    </span>
  )
}
