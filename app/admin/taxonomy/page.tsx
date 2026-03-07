'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

interface TaxonomyItem {
  id: string
  type: 'main' | 'detail'
  label: string
  sort_order: number
}

export default function TaxonomyAdminPage() {
  const supabase = createClient()
  const [items, setItems] = useState<TaxonomyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [newMain, setNewMain] = useState('')
  const [newDetail, setNewDetail] = useState('')
  const [error, setError] = useState('')
  const [tableReady, setTableReady] = useState(true)

  const load = async () => {
    const { data, error } = await supabase
      .from('taxonomy_items')
      .select('*')
      .order('sort_order')

    if (error) {
      // Table may not exist yet — show seed button
      setTableReady(false)
      setLoading(false)
      return
    }

    setItems((data as TaxonomyItem[]) || [])
    setTableReady(true)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const mainItems = items.filter(i => i.type === 'main')
  const detailItems = items.filter(i => i.type === 'detail')

  async function addItem(type: 'main' | 'detail', label: string) {
    const trimmed = label.trim()
    if (!trimmed) return
    if (items.some(i => i.type === type && i.label === trimmed)) {
      setError('이미 존재하는 항목입니다.')
      return
    }
    setError('')
    setSaving('add')

    const typeItems = items.filter(i => i.type === type)
    const maxOrder = typeItems.length > 0 ? Math.max(...typeItems.map(i => i.sort_order)) : 0

    const { error } = await supabase.from('taxonomy_items').insert({
      type,
      label: trimmed,
      sort_order: maxOrder + 1,
    })

    if (error) {
      setError('추가 실패: ' + error.message)
    } else {
      if (type === 'main') setNewMain('')
      else setNewDetail('')
      await load()
    }
    setSaving(null)
  }

  async function deleteItem(id: string) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    setSaving(id)
    await supabase.from('taxonomy_items').delete().eq('id', id)
    setSaving(null)
    await load()
  }

  async function moveItem(item: TaxonomyItem, direction: 'up' | 'down') {
    const typeItems = items.filter(i => i.type === item.type).sort((a, b) => a.sort_order - b.sort_order)
    const idx = typeItems.findIndex(i => i.id === item.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= typeItems.length) return

    const swapItem = typeItems[swapIdx]
    setSaving(item.id)

    await Promise.all([
      supabase.from('taxonomy_items').update({ sort_order: swapItem.sort_order }).eq('id', item.id),
      supabase.from('taxonomy_items').update({ sort_order: item.sort_order }).eq('id', swapItem.id),
    ])

    setSaving(null)
    await load()
  }

  async function seedDefaults() {
    setSaving('seed')
    const mainSeeds = [...MAIN_SPECIALIZATIONS].map((label, i) => ({ type: 'main' as const, label, sort_order: i + 1 }))
    const detailSeeds = [...DETAILED_SPECIALTIES].map((label, i) => ({ type: 'detail' as const, label, sort_order: i + 1 }))

    await supabase.from('taxonomy_items').upsert([...mainSeeds, ...detailSeeds], { onConflict: 'type,label' })
    setSaving(null)
    await load()
  }

  if (loading) {
    return <div className="p-8 text-gray-500">불러오는 중...</div>
  }

  if (!tableReady) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">분야 / 세부전문 관리</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <p className="text-sm text-yellow-800 font-medium mb-1">taxonomy_items 테이블이 없습니다.</p>
          <p className="text-xs text-yellow-700 mb-4">
            Supabase에서 <code>supabase/migrations/v5_taxonomy.sql</code>을 먼저 실행해 주세요.
          </p>
          <button
            onClick={seedDefaults}
            disabled={saving === 'seed'}
            className="px-4 py-2 bg-[#2563EB] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {saving === 'seed' ? '초기화 중...' : '기본값으로 초기화'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">분야 / 세부전문 관리</h1>
      <p className="text-gray-500 text-sm mb-8">채용공고·필터·프로필에 사용되는 분야 목록을 관리합니다.</p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* 주요 분야 */}
        <TaxonomySection
          title="주요 분야"
          items={mainItems}
          newValue={newMain}
          onNewValueChange={setNewMain}
          onAdd={() => addItem('main', newMain)}
          onDelete={deleteItem}
          onMove={moveItem}
          saving={saving}
        />

        {/* 세부 전문분야 */}
        <TaxonomySection
          title="세부 전문분야"
          items={detailItems}
          newValue={newDetail}
          onNewValueChange={setNewDetail}
          onAdd={() => addItem('detail', newDetail)}
          onDelete={deleteItem}
          onMove={moveItem}
          saving={saving}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-400 mb-3">기본값으로 초기화 (현재 목록이 모두 유지됩니다. 중복은 무시)</p>
        <button
          onClick={seedDefaults}
          disabled={saving === 'seed'}
          className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {saving === 'seed' ? '초기화 중...' : '기본값 동기화'}
        </button>
      </div>
    </div>
  )
}

function TaxonomySection({
  title,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  onDelete,
  onMove,
  saving,
}: {
  title: string
  items: TaxonomyItem[]
  newValue: string
  onNewValueChange: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onMove: (item: TaxonomyItem, dir: 'up' | 'down') => void
  saving: string | null
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        {title}
        <span className="ml-2 text-xs font-normal text-gray-400">{items.length}개</span>
      </h2>

      {/* Add new */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newValue}
          onChange={e => onNewValueChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          placeholder="새 항목 추가..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={saving === 'add' || !newValue.trim()}
          className="px-3 py-2 bg-[#2563EB] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          추가
        </button>
      </div>

      {/* Item list */}
      <div className="space-y-1 max-h-[480px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-gray-400 py-4 text-center">항목이 없습니다.</p>
        )}
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 group"
          >
            {/* Order buttons */}
            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onMove(item, 'up')}
                disabled={idx === 0 || saving === item.id}
                className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => onMove(item, 'down')}
                disabled={idx === items.length - 1 || saving === item.id}
                className="w-5 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs leading-none"
              >
                ▼
              </button>
            </div>

            {/* Order number */}
            <span className="text-xs text-gray-300 w-5 text-right flex-shrink-0">{idx + 1}</span>

            {/* Label */}
            <span className="flex-1 text-sm text-gray-700 truncate">{item.label}</span>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={saving === item.id}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 text-lg leading-none disabled:opacity-20"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
