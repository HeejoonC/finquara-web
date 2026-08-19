'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Waitlist } from '@/types/database'
import { PageHeader } from '@/components/ui/Form'

export default function AdminWaitlistPage() {
  const supabase = createClient()
  const [list, setList] = useState<Waitlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false })
      setList((data as Waitlist[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading)
    return (
      <div className="container">
        <p className="label-sm">Loading…</p>
      </div>
    )

  return (
    <div className="container">
      <PageHeader
        index="Admin / Waitlist"
        title="Waitlist."
        description={`총 ${list.length}명 등록.`}
      />

      <div className="mt-14 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="table-head">
              <th className="w-16 py-4 font-semibold">#</th>
              <th className="py-4 font-semibold">Email</th>
              <th className="py-4 font-semibold">Note</th>
              <th className="py-4 text-right font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, i) => (
              <tr key={item.id} className="row border-b border-line">
                <td className="num py-5">{String(i + 1).padStart(2, '0')}</td>
                <td className="py-5 text-[0.98rem] text-ink">{item.email}</td>
                <td className="body-sm py-5">{item.note || '—'}</td>
                <td className="num py-5 text-right">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="body border-t border-line py-16">등록된 대기자가 없습니다.</p>}
      </div>
    </div>
  )
}
