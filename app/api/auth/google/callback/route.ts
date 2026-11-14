import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import {
  GOOGLE_NEXT_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleIsConfigured,
  googleRedirectUri,
  landingFor,
  safeNextPath,
} from '@/lib/google-oauth'
import { createGoogleRegistration, GOOGLE_REGISTRATION_COOKIE } from '@/lib/google-registration'

type GoogleProfile = {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
}

function errorRedirect(request: NextRequest, code: string) {
  const response = NextResponse.redirect(new URL(`/login?oauth_error=${code}`, request.url))
  response.cookies.delete(GOOGLE_STATE_COOKIE)
  response.cookies.delete(GOOGLE_VERIFIER_COOKIE)
  response.cookies.delete(GOOGLE_NEXT_COOKIE)
  return response
}

export async function GET(request: NextRequest) {
  if (!googleIsConfigured()) return errorRedirect(request, 'google_not_configured')
  if (request.nextUrl.searchParams.get('error')) return errorRedirect(request, 'google_cancelled')

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value
  const verifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return errorRedirect(request, 'invalid_google_state')
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(request.nextUrl.origin),
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      cache: 'no-store',
    })
    if (!tokenResponse.ok) return errorRedirect(request, 'google_token_failed')

    const token = (await tokenResponse.json()) as { access_token?: string }
    if (!token.access_token) return errorRedirect(request, 'google_token_failed')

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${token.access_token}` },
      cache: 'no-store',
    })
    if (!profileResponse.ok) return errorRedirect(request, 'google_profile_failed')

    const profile = (await profileResponse.json()) as GoogleProfile
    const email = profile.email?.trim().toLowerCase()
    if (!profile.sub || !email || !profile.email_verified) {
      return errorRedirect(request, 'google_email_unverified')
    }

    const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true } })
    if (user) {
      await db.user.update({ where: { id: user.id }, data: { verified: true } })
    } else {
      const response = NextResponse.redirect(new URL('/register/google', request.url))
      response.cookies.set(
        GOOGLE_REGISTRATION_COOKIE,
        createGoogleRegistration({
          email,
          name: profile.name?.trim() || email.split('@')[0],
          subject: profile.sub,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 10 * 60,
        }
      )
      response.cookies.delete(GOOGLE_STATE_COOKIE)
      response.cookies.delete(GOOGLE_VERIFIER_COOKIE)
      response.cookies.delete(GOOGLE_NEXT_COOKIE)
      return response
    }

    await createSession(user.id, (await headers()).get('user-agent'))
    const nextPath = safeNextPath(request.cookies.get(GOOGLE_NEXT_COOKIE)?.value)
    const response = NextResponse.redirect(new URL(nextPath ?? landingFor(user.role), request.url))
    response.cookies.delete(GOOGLE_STATE_COOKIE)
    response.cookies.delete(GOOGLE_VERIFIER_COOKIE)
    response.cookies.delete(GOOGLE_NEXT_COOKIE)
    return response
  } catch (error) {
    console.error('Google OAuth callback failed', error)
    return errorRedirect(request, 'google_login_failed')
  }
}
