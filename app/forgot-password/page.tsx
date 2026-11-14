import type { Metadata } from 'next'
import { getI18n } from '@/lib/i18n/server'
import ForgotPasswordContent from './forgot-password-content'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return { title: dict.account.forgot_password.meta_title, robots: { index: false } }
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />
}
