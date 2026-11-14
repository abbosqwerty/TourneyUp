import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { GOOGLE_REGISTRATION_COOKIE, readGoogleRegistration, suggestedGoogleUsername } from '@/lib/google-registration'
import { getI18n } from '@/lib/i18n/server'
import GoogleRegisterContent from './google-register-content'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return { title: dict.account.register.google_title, robots: { index: false } }
}

export default async function GoogleRegisterPage() {
  const token = (await cookies()).get(GOOGLE_REGISTRATION_COOKIE)?.value
  const registration = readGoogleRegistration(token)
  if (!registration) redirect('/register')

  return (
    <GoogleRegisterContent
      email={registration.email}
      defaultName={registration.name}
      defaultUsername={suggestedGoogleUsername(registration.email, registration.subject)}
    />
  )
}
