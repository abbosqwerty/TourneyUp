import { createHash } from 'crypto'
import { env } from './env'

export const GOOGLE_STATE_COOKIE = 'tu_google_state'
export const GOOGLE_VERIFIER_COOKIE = 'tu_google_verifier'
export const GOOGLE_NEXT_COOKIE = 'tu_google_next'
export const GOOGLE_FLOW_TTL_SECONDS = 10 * 60

export function googleRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, '')}/api/auth/google/callback`
}

export function googleIsConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

export function codeChallenge(verifier: string) {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function safeNextPath(value: string | null | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null
}

export function landingFor(role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN') {
  if (role === 'SUPER_ADMIN') return '/admin'
  if (role === 'ORGANIZATION') return '/dashboard'
  return '/feed'
}

