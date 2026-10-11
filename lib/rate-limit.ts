import { headers } from 'next/headers'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_KEYS = 10_000

/**
 * Process-local fixed-window limiter. Good enough for a single Node
 * instance; swap for Redis when the app runs on more than one.
 */
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true, retryAfterMs: 0 }
  }
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
      if (buckets.size > MAX_KEYS) buckets.clear()
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterMs: 0 }
  }

  if (existing.count >= max) {
    return { ok: false, retryAfterMs: existing.resetAt - now }
  }

  existing.count += 1
  return { ok: true, retryAfterMs: 0 }
}

/** Client IP behind a proxy (Netlify / nginx). Falls back to a constant. */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers()
    const forwarded = h.get('x-nf-client-connection-ip') ?? h.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return h.get('x-real-ip') ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export function minutes(n: number) {
  return n * 60 * 1000
}

/**
 * Convenience wrapper for server actions: returns `null` when the call is
 * allowed, or a ready-made failure with a human-readable wait time.
 *
 * Server actions are plain HTTP endpoints, so every write path needs this —
 * not just the login form.
 */
export function guard(
  key: string,
  max: number,
  windowMs: number
): { ok: false; error: string } | null {
  const limit = rateLimit(key, max, windowMs)
  if (limit.ok) return null

  const waitMinutes = Math.ceil(limit.retryAfterMs / 60_000)
  const wait = waitMinutes > 1 ? `${waitMinutes} daqiqa` : 'bir daqiqa'
  return { ok: false, error: `Juda ko‘p urinish. ${wait}dan keyin qayta urinib ko‘ring.` }
}
