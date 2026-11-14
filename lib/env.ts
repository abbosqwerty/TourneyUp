import { z } from 'zod'

/**
 * Validate configuration once, at import time, so a missing or malformed
 * variable fails loudly on startup instead of as a 500 on the first request.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL majburiy'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY majburiy'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM majburiy'),
})

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
})

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')
  throw new Error(`Muhit o'zgaruvchilari noto'g'ri:\n${details}\n\n.env.example faylidan nusxa oling.`)
}

export const env = {
  DATABASE_URL: parsed.data.DATABASE_URL,
  SITE_URL: parsed.data.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  GOOGLE_CLIENT_ID: parsed.data.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: parsed.data.GOOGLE_CLIENT_SECRET,
  RESEND_API_KEY: parsed.data.RESEND_API_KEY,
  EMAIL_FROM: parsed.data.EMAIL_FROM,
}
