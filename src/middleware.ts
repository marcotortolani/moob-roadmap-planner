import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // v0.8.7: Explicit cookie attributes to ensure Chrome compatibility.
              // Without these, Chrome may not expose cookies to document.cookie,
              // causing createBrowserClient to lose the session on reload.
              path: '/',
              secure: true,
              sameSite: 'lax' as const,
              httpOnly: false, // Must be false so createBrowserClient can read via document.cookie
            })
          )
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
  supabaseResponse.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, max-age=0, must-revalidate'
  )
  // Vercel-specific: Tell Vercel's CDN not to cache this response
  supabaseResponse.headers.set('CDN-Cache-Control', 'no-store')
  // Standard proxy header: Tell upstream proxies/CDNs not to cache
  supabaseResponse.headers.set('Surrogate-Control', 'no-store')
  // Vary on everything to prevent any proxy from serving cached responses
  // to different users (different cookies = different auth state)
  supabaseResponse.headers.set('Vary', '*')

  // Content Security Policy
  // unsafe-eval: required by Next.js dev (webpack), kept for compatibility
  // unsafe-inline: required by Tailwind CSS inline styles and Next.js hydration
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://*.supabase.co https://www.google-analytics.com",
    "font-src 'self'",
    // In dev, Next.js HMR uses ws://127.0.0.1:<random-port> for hot reload
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com${process.env.NODE_ENV === 'development' ? ' ws://localhost:* ws://127.0.0.1:*' : ''}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ]
  supabaseResponse.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
