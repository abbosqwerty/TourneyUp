'use client'

import { AuthShell } from '@/components/auth/auth-shell'
import { useLanguage } from '@/lib/i18n/language-context'
import { GoogleRegisterForm } from './google-register-form'

export default function GoogleRegisterContent(props: {
  email: string
  defaultName: string
  defaultUsername: string
}) {
  const { dict } = useLanguage()
  const t = dict.account.register

  return (
    <AuthShell title={t.google_title} subtitle={t.google_subtitle}>
      <GoogleRegisterForm {...props} />
    </AuthShell>
  )
}
