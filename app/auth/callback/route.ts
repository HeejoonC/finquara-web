import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  const cookiesToApply: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return (
            request.headers
              .get('cookie')
              ?.split('; ')
              .map(c => {
                const [name, ...rest] = c.split('=')
                return { name: name.trim(), value: rest.join('=') }
              }) ?? []
          )
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookiesToApply.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  // Determine redirect based on profile completeness and role
  let redirectTo = `${origin}${next}`

  // For auth flows (password reset etc.), skip profile-based redirect
  if (!next.startsWith('/auth/')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, phone, full_name, auth_provider')
        .eq('id', user.id)
        .single()

      if (profile) {
        const needsOnboarding =
          profile.auth_provider === 'kakao' && !profile.phone

        if (needsOnboarding) {
          redirectTo = `${origin}/auth/onboarding`
        } else if (profile.role === 'admin') {
          redirectTo = `${origin}/admin`
        } else if (profile.role === 'employer') {
          redirectTo = `${origin}/company/profile`
        } else {
          redirectTo = `${origin}/jobs`
        }
      }
    }
  }

  const response = NextResponse.redirect(redirectTo)
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
