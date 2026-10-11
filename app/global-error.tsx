'use client'

import { useEffect, useState } from 'react'
import { dictionaries } from '@/lib/i18n/dictionaries'
import { DEFAULT_LOCALE, LANGUAGE_COOKIE, isLocale, type Locale } from '@/lib/i18n/types'

/**
 * Last-resort boundary: it replaces the whole document, so it cannot rely
 * on the app's providers, fonts or Tailwind layer being mounted. The
 * language is read straight from the cookie the language switcher writes.
 */
function readLocale(): Locale {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`))
  const value = match?.[1]
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)
  useEffect(() => setLocale(readLocale()), [])
  const t = dictionaries[locale].chrome.error

  return (
    <html lang={locale}>
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#384959',
          color: '#ffffe3',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{t.global_title}</h1>
          <p style={{ opacity: 0.8, marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {t.global_description}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#88bdf2',
              color: '#384959',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.retry}
          </button>
          {error.digest ? (
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>{t.code(error.digest)}</p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
