import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function Navbar() {
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()
      profile = profileData
    }
  } catch {
    // Supabase 오류 시 비로그인 상태로 표시
  }

  const profileHref = profile?.role === 'employer' ? '/company/profile' : '/profile'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#0B1F3A]">
          Finquara
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/jobs" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">
            채용공고
          </Link>
          <Link href="/salary-survey" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">
            Salary Survey
          </Link>

{profile?.role === 'admin' && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">
              관리자
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href={profileHref}
                className="text-sm text-gray-700 hover:text-[#2563EB] transition-colors font-medium"
              >
                {profile?.full_name || user.email}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
