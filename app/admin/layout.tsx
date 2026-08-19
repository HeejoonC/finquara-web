import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/taxonomy', label: 'Taxonomy' },
  { href: '/admin/waitlist', label: 'Waitlist' },
  { href: '/admin/salary-survey', label: 'Salary' },
  { href: '/admin/ai-import', label: 'AI Import' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <>
      {/* 관리자 서브 내비 — 사이드바 대신 헤더 아래 가로 괘선 */}
      <div className="sticky top-[72px] z-50 border-b border-line bg-bg-strong/80 backdrop-blur-[18px]">
        <div className="container flex items-center gap-x-7 gap-y-2 overflow-x-auto py-3.5">
          <span className="label-sm whitespace-nowrap opacity-60">Admin</span>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className="label-sm link whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="section-tight">{children}</main>
    </>
  )
}
