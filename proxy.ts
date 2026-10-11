import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'tu_session'

/**
 * Cheap edge-side gate: anything under these prefixes needs *a* session.
 * Role checks need the database, so they stay in the server components
 * (`app/admin/layout.tsx`, `app/(main)/dashboard/...`) — middleware only
 * keeps guests off private routes.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`.
 */
const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/create',
  '/saved',
  '/profile',
  '/messages',
  '/notifications',
  '/staff',
  '/settings',
  '/teams',
]

const GUEST_ONLY = ['/login', '/register']

/**
 * Per-request nonce so Next.js' own inline bootstrap scripts can run without
 * `'unsafe-inline'`. Anything else injected into the page has no nonce and is
 * therefore blocked — which is the whole point of having a policy.
 *
 * `'unsafe-inline'` stays in `style-src`: Tailwind/Radix write inline styles
 * for transforms and CSS variables, and style injection is not a script-
 * execution vector.
 */
function contentSecurityPolicy(nonce: string, isDev: boolean) {
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'` // dev needs eval for HMR
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    // next/font self-hosts Google fonts at build time, so 'self' is enough.
    `font-src 'self' data:`,
    // Uploaded media is streamed from /api/media/[id]; blob: covers previews.
    `img-src 'self' data: blob:`,
    `media-src 'self' blob:`,
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ].join('; ')
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  if (hasSession && GUEST_ONLY.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const nonce = crypto.randomUUID().replace(/-/g, '')
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV !== 'production')

  // Next.js reads `x-nonce` off the request and stamps it onto its own scripts.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
}
