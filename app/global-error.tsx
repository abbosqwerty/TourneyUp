'use client'

/**
 * Last-resort boundary: it replaces the whole document, so it cannot rely
 * on the app's providers, fonts or Tailwind layer being mounted.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="uz">
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
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Ilova ishdan chiqdi</h1>
          <p style={{ opacity: 0.8, marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Kutilmagan xatolik yuz berdi. Sahifani qayta yuklashga urinib ko‘ring.
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
            Qayta urinish
          </button>
          {error.digest ? (
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>Kod: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
