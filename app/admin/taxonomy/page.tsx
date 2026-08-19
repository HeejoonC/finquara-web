'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'
import { PageHeader } from '@/components/ui/Form'

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
    return (
      <div className="container">
        <p className="label-sm">Loading…</p>
      </div>
    )
  }

  if (!tableReady) {
    return (
      <div className="container">
        <PageHeader index="Admin / Taxonomy" title="Taxonomy." />
        <div className="notice mt-12 max-w-[60ch]">
          <p className="font-semibold">taxonomy_items 테이블이 없습니다.</p>
          <p className="mt-2">
            Supabase에서 <code>supabase/migrations/v5_taxonomy.sql</code>을 먼저 실행해 주세요.
          </p>
        </div>
        <button
          type="button"
          onClick={seedDefaults}
          disabled={saving === 'seed'}
          className="btn mt-8"
        >
          {saving === 'seed' ? '초기화 중' : '기본값으로 초기화'}
        </button>
      </div>
    )
  }

  return (
    <div className="container">
      <PageHeader
        index="Admin / Taxonomy"
        title="Taxonomy."
        description="채용공고·필터·프로필에 사용되는 분야 목록을 관리합니다."
      />

      {error && <div className="notice mt-10 max-w-[60ch]">{error}</div>}

      <div className="mt-14 grid grid-cols-2 gap-x-16 gap-y-16 fold-980">
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

      <div className="mt-20 border-t border-line-strong pt-10">
        <p className="body-sm max-w-[60ch]">
          기본값 동기화 — 현재 목록은 모두 유지되고 중복은 무시됩니다.
        </p>
        <button
          type="button"
          onClick={seedDefaults}
          disabled={saving === 'seed'}
          className="btn btn-ghost mt-6"
        >
          {saving === 'seed' ? '초기화 중' : '기본값 동기화'}
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
  const inputId = `tax-${title}`
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-line-strong pb-4">
        <p className="label-sm">{title}</p>
        <span className="num">{items.length}</span>
      </div>

      {/* Add new */}
      <div className="mt-8 flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor={inputId} className="form-label">
            새 항목
          </label>
          <input
            id={inputId}
            type="text"
            value={newValue}
            onChange={e => onNewValueChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
            placeholder="항목명 입력"
            className="field"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={saving === 'add' || !newValue.trim()}
          className="btn btn-sm"
        >
          Add
        </button>
      </div>

      {/* Item list */}
      <div className="mt-8 max-h-[480px] overflow-y-auto border-t border-line">
        {items.length === 0 && <p className="body-sm py-6">항목이 없습니다.</p>}
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="group flex items-center gap-4 border-b border-line py-3"
          >
            <span className="num w-6 flex-shrink-0 text-right">
              {String(idx + 1).padStart(2, '0')}
            </span>

            <span className="flex-1 truncate text-[0.96rem] text-ink">{item.label}</span>

            {/* Order buttons */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                aria-label="위로"
                onClick={() => onMove(item, 'up')}
                disabled={idx === 0 || saving === item.id}
                className="px-1.5 text-[0.6rem] leading-none text-muted hover:text-ink disabled:opacity-20"
              >
                ▲
              </button>
              <button
                type="button"
                aria-label="아래로"
                onClick={() => onMove(item, 'down')}
                disabled={idx === items.length - 1 || saving === item.id}
                className="px-1.5 text-[0.6rem] leading-none text-muted hover:text-ink disabled:opacity-20"
              >
                ▼
              </button>
              <button
                type="button"
                aria-label="삭제"
                onClick={() => onDelete(item.id)}
                disabled={saving === item.id}
                className="ml-2 px-1 text-base leading-none text-muted hover:text-ink disabled:opacity-20"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
