'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Waitlist } from '@/types/database'

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

  if (loading) return <div className="p-8 text-gray-500">불러오는 중...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">대기목록</h1>
      <p className="text-gray-500 text-sm mb-8">총 {list.length}명 등록</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">메모</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-800">{item.email}</td>
                <td className="px-6 py-4 text-gray-500">{item.note || '—'}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">등록된 대기자가 없습니다.</div>
        )}
      </div>
    </div>
  )
}
