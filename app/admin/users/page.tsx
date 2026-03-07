'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

const ROLE_LABEL: Record<string, string> = {
  job_seeker: '구직자',
  employer: '기업',
  admin: '관리자',
}

const ROLE_STYLE: Record<string, string> = {
  job_seeker: 'bg-green-100 text-green-700',
  employer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers((data as Profile[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateRole = async (id: string, role: string) => {
    setUpdating(id)
    await supabase.from('profiles').update({ role }).eq('id', id)
    await load()
    setUpdating(null)
  }

  if (loading) {
    return <div className="p-8 text-gray-500">불러오는 중...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-1">회원 관리</h1>
      <p className="text-gray-500 text-sm mb-8">전체 {users.length}명</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">역할</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">가입일</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">역할 변경</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.full_name || '—'}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    disabled={updating === user.id}
                    onChange={e => updateRole(user.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50"
                  >
                    <option value="job_seeker">구직자</option>
                    <option value="employer">기업</option>
                    <option value="admin">관리자</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">가입된 회원이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
