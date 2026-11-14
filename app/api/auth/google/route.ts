import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import {
  GOOGLE_FLOW_TTL_SECONDS,
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  codeChallenge,
  googleIsConfigured,
  googleRedirectUri,
  safeNextPath,
} from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  if (!googleIsConfigured()) {
    return NextResponse.redirect(new URL('/login?oauth_error=google_not_configured', request.url))
  }

  const state = randomBytes(24).toString('base64url')
  const verifier = randomBytes(48).toString('base64url')
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizationUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!)
  authorizationUrl.searchParams.set('redirect_uri', googleRedirectUri(request.nextUrl.origin))
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('scope', 'openid email profile')
  authorizationUrl.searchParams.set('state', state)
  authorizationUrl.searchParams.set('code_challenge', codeChallenge(verifier))
  authorizationUrl.searchParams.set('code_challenge_method', 'S256')
  authorizationUrl.searchParams.set('prompt', 'select_account')

  const response = NextResponse.redirect(authorizationUrl)
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: GOOGLE_FLOW_TTL_SECONDS,
  }
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions)
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, cookieOptions)

  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))
  if (nextPath) response.cookies.set(GOOGLE_NEXT_COOKIE, nextPath, cookieOptions)

  return response
}
