'use client'

import React, { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dictionaries, type Dictionary } from './dictionaries'
import { DEFAULT_LOCALE, LANGUAGE_COOKIE, type Locale } from './types'

export { LANGUAGE_COOKIE }

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  dict: Dictionary
}

const LanguageContext = createContext<LanguageContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  dict: dictionaries[DEFAULT_LOCALE],
})

/**
 * The cookie is the single source of truth: the root layout reads it on the
 * server and passes `initialLocale`, so the first paint is already in the
 * right language (no flash, no hydration mismatch). Switching writes the
 * cookie and refreshes, so server components re-render in the new language.
 */
export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = next
    startTransition(() => router.refresh())
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dict: dictionaries[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export const useTranslation = useLanguage
