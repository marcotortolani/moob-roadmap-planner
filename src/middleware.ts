import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Get authenticated user (more secure than getSession on server)
  const { data: { user } } = await supabase.auth.getUser()
  const session = user ? true : false

  // Public routes (no auth required)
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )

  // Public API routes (no auth required)
  const publicApiRoutes = ['/api/invitations/validate', '/api/invitations/accept']
  const isPublicApiRoute = publicApiRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // If no session and trying to access protected route, redirect to login
  // But allow public API routes through
  if (!session && !isPublicRoute && !isPublicApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If has session and trying to access auth pages, redirect to home
  // BUT: Don't redirect if coming from blocked error OR reset-password page
  const hasBlockedError = request.nextUrl.searchParams.get('error') === 'blocked'
  const isResetPasswordPage = request.nextUrl.pathname === '/reset-password'
  if (session && isPublicRoute && !hasBlockedError && !isResetPasswordPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If has session, check if user is BLOCKED (but only on protected routes)
  if (session && !isPublicRoute && !isPublicApiRoute) {
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!error && dbUser && dbUser.role === 'BLOCKED') {
      // Sign out blocked user
      await supabase.auth.signOut()

      // Redirect to login with error message
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'blocked')
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
