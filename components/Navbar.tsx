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
    <header className="site-header">
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          className="text-[1.05rem] font-extrabold tracking-[-0.05em] text-ink"
        >
          Finquara
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link href="/jobs" className="label link">
            Jobs
          </Link>
          <Link href="/salary-survey" className="label link hidden sm:inline-block">
            Salary
          </Link>

          {profile?.role === 'admin' && (
            <Link href="/admin" className="label link hidden sm:inline-block">
              Admin
            </Link>
          )}

          <span className="hidden h-4 w-px bg-line-strong sm:block" aria-hidden />

          {user ? (
            <>
              <Link href={profileHref} className="label link max-w-[14ch] truncate normal-case tracking-[0.06em]">
                {profile?.full_name || user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="label link">
                Log in
              </Link>
              <Link href="/auth/signup" className="btn btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
