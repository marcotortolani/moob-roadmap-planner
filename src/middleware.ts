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

  // BLOCKED user check is handled in AuthProvider (auth-context.tsx) on login,
  // not here. The previous approach queried the DB on EVERY request, adding
  // ~100-300ms latency to every page navigation.

  // Prevent CDN and browser from caching HTML/RSC responses with stale auth state.
  // Static assets are excluded by the matcher config below.
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, max-age=0, must-revalidate'
  )
  // Vercel-specific: Tell Vercel's CDN not to cache this response
  response.headers.set('CDN-Cache-Control', 'no-store')
  // Standard proxy header: Tell upstream proxies/CDNs not to cache
  response.headers.set('Surrogate-Control', 'no-store')
  // Vary on everything to prevent any proxy from serving cached responses
  // to different users (different cookies = different auth state)
  response.headers.set('Vary', '*')

  // Content Security Policy
  // unsafe-eval: required by Next.js dev (webpack), kept for compatibility
  // unsafe-inline: required by Tailwind CSS inline styles and Next.js hydration
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
