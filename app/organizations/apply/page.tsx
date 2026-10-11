import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { getI18n } from '@/lib/i18n/server'
import { ApplyForm } from './apply-form'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.account.apply.meta_title,
    description: dict.account.apply.meta_description,
  }
}

export default async function ApplyPage() {
  const { dict } = await getI18n()
  const t = dict.account.apply

  return (
    <AuthShell
      wide
      title={t.title}
      subtitle={t.subtitle}
      footer={
        <>
          {t.footer_question}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t.footer_link}
          </Link>
        </>
      }
    >
      <ApplyForm />
    </AuthShell>
  )
}
