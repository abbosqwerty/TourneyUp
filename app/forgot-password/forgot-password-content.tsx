'use client'

import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { useLanguage } from '@/lib/i18n/language-context'
import { ForgotPasswordForm } from './forgot-password-form'

export default function ForgotPasswordContent() {
  const { dict } = useLanguage()
  const t = dict.account.forgot_password
  return (
    <AuthShell
      title={t.title}
      subtitle={t.subtitle}
      footer={<Link href="/login" className="font-semibold text-primary hover:underline">{t.back_login}</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
