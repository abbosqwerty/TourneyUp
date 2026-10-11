import type { Metadata } from 'next'
import { formatDateLong } from '@/lib/time'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.legal.privacy.meta_title,
    description: dict.legal.privacy.meta_description,
  }
}

const UPDATED = '2026-10-09'

/** `backticked` fragments of a translation render as <code>. */
function withCode(text: string) {
  return text.split('`').map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part))
}

function Item({ label, text }: { label: string; text: string }) {
  return (
    <li>
      <strong>{label}</strong> {text}
    </li>
  )
}

export default async function PrivacyPage() {
  const { dict, locale } = await getI18n()
  const t = dict.legal.privacy

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

      <h2>{t.collect_title}</h2>
      <ul>
        <Item {...t.collect.account} />
        <Item {...t.collect.activity} />
        <Item {...t.collect.session} />
        <Item {...t.collect.uploads} />
      </ul>

      <h2>{t.use_title}</h2>
      <ul>
        <li>{t.use.account}</li>
        <li>{t.use.registration}</li>
        <li>{t.use.notifications}</li>
        <li>{t.use.abuse}</li>
      </ul>
      <p>{t.no_ads}</p>

      <h2>{t.visibility_title}</h2>
      <ul>
        <Item {...t.visibility.public} />
        <Item {...t.visibility.organizer} />
        <Item {...t.visibility.nobody} />
      </ul>

      <h2>{t.cookie_title}</h2>
      <p>{withCode(t.cookie)}</p>

      <h2>{t.retention_title}</h2>
      <ul>
        <li>{t.retention.account}</li>
        <li>{t.retention.session}</li>
        <li>{t.retention.history}</li>
      </ul>

      <h2>{t.rights_title}</h2>
      <ul>
        <Item {...t.rights.edit} />
        <Item {...t.rights.delete} />
        <Item {...t.rights.export} />
      </ul>

      <h2>{t.security_title}</h2>
      <p>{withCode(t.security)}</p>

      <h2>{t.contact_title}</h2>
      <p>
        {t.contact} <a className="underline" href="mailto:privacy@tourneyup.uz">privacy@tourneyup.uz</a>
      </p>

      <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">{t.note}</p>
    </>
  )
}
