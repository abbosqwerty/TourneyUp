import { createHmac, timingSafeEqual } from 'crypto'
import { env } from './env'
import { isForbiddenUsername } from './username-policy'

export const GOOGLE_REGISTRATION_COOKIE = 'tu_google_registration'

export type GoogleRegistration = {
  email: string
  name: string
  subject: string
  expiresAt: number
}

function signature(payload: string) {
  return createHmac('sha256', env.GOOGLE_CLIENT_SECRET!).update(payload).digest('base64url')
}

export function createGoogleRegistration(data: Omit<GoogleRegistration, 'expiresAt'>) {
  const payload = Buffer.from(JSON.stringify({ ...data, expiresAt: Date.now() + 10 * 60 * 1000 })).toString('base64url')
  return payload + '.' + signature(payload)
}

export function readGoogleRegistration(token: string | undefined): GoogleRegistration | null {
  if (!token || !env.GOOGLE_CLIENT_SECRET) return null
  const [payload, suppliedSignature] = token.split('.')
  if (!payload || !suppliedSignature) return null

  const expected = Buffer.from(signature(payload))
  const supplied = Buffer.from(suppliedSignature)
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleRegistration
    if (!value.email || !value.subject || !value.name || value.expiresAt < Date.now()) return null
    return value
  } catch {
    return null
  }
}

export function suggestedGoogleUsername(email: string, subject: string) {
  const localPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
  const base = localPart.length >= 3 ? localPart : 'player'
  if (!isForbiddenUsername(base)) return base
  return `player_${subject.replace(/[^0-9]/g, '').slice(-6) || 'user'}`
}
