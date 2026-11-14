import { env } from './env'

export async function sendRegistrationCode(email: string, code: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: 'TourneyUp tasdiqlash kodi',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>TourneyUp</h2><p>Ro‘yxatdan o‘tishni yakunlash uchun tasdiqlash kodi:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;padding:18px 0">${code}</div><p>Kod 10 daqiqa amal qiladi. Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p></div>`,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Resend registration email failed', response.status, detail)
    throw new Error('EMAIL_SEND_FAILED')
  }
}

export async function sendPasswordResetCode(email: string, code: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: 'TourneyUp parolni tiklash kodi',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>TourneyUp</h2><p>Parolingizni yangilash uchun tasdiqlash kodi:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;padding:18px 0">${code}</div><p>Kod 10 daqiqa amal qiladi va faqat bir marta ishlatiladi. Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p></div>`,
    }),
    cache: 'no-store',
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Resend password reset email failed', response.status, detail)
    throw new Error('EMAIL_SEND_FAILED')
  }
}
