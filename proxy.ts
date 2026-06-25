import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'
  const isAdminRoot = pathname === '/admin'

  // Authenticated users don't need the login page or the bare /admin root
  if ((isLoginPage || isAdminRoot) && user) {
    return NextResponse.redirect(new URL('/admin/qa', request.url))
  }

  // Unauthenticated users can only access the login page
  if (!isLoginPage && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
