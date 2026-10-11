import type { Metadata } from 'next'
import { formatDateLong } from '@/lib/time'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.legal.terms.meta_title,
    description: dict.legal.terms.meta_description,
  }
}

const UPDATED = '2026-10-09'

export default async function TermsPage() {
  const { dict, locale } = await getI18n()
  const t = dict.legal.terms

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-sm">
          {dict.legal.updated}{' '}
          <time dateTime={UPDATED}>
            {formatDateLong(UPDATED, locale)}
          </time>
        </p>
      </header>

      <p>{t.intro}</p>

      <h2>{t.account_title}</h2>
      <ul>
        <li>{t.account.one}</li>
        <li>{t.account.password}</li>
        <li>{t.account.organization}</li>
      </ul>

      <h2>{t.tournaments_title}</h2>
      <ul>
        <li>{t.tournaments.responsibility}</li>
        <li>{t.tournaments.approval}</li>
        <li>{t.tournaments.disputes}</li>
      </ul>

      <h2>{t.prohibited_title}</h2>
      <ul>
        <li>{t.prohibited.impersonation}</li>
        <li>{t.prohibited.abusive}</li>
        <li>{t.prohibited.automation}</li>
        <li>{t.prohibited.copyright}</li>
      </ul>
      <p>{t.enforcement}</p>

      <h2>{t.content_title}</h2>
      <p>{t.content}</p>

      <h2>{t.liability_title}</h2>
      <p>{t.liability}</p>

      <h2>{t.changes_title}</h2>
      <p>{t.changes}</p>

      <h2>{t.contact_title}</h2>
      <p>
        <a className="underline" href="mailto:support@tourneyup.uz">support@tourneyup.uz</a>
      </p>

      <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">{t.note}</p>
    </>
  )
}
