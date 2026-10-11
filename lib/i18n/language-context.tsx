'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { dictionaries } from './dictionaries'
import { DEFAULT_LOCALE, type Locale } from './types'

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
  dict: typeof dictionaries[keyof typeof dictionaries];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (path: string, fallback?: string) => fallback ?? path,
  dict: dictionaries.uz,
})

export const LANGUAGE_COOKIE = 'tourneyup_lang'

function getSavedLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  try {
    const fromStorage = localStorage.getItem(LANGUAGE_COOKIE) as Locale | null
    if (fromStorage && (fromStorage === 'uz' || fromStorage === 'ru' || fromStorage === 'en')) {
      return fromStorage
    }

    const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`))
    if (match) {
      const fromCookie = decodeURIComponent(match[1]) as Locale
      if (fromCookie === 'uz' || fromCookie === 'ru' || fromCookie === 'en') {
        return fromCookie
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initial = getSavedLocale()
    setLocaleState(initial)
    document.documentElement.lang = initial
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LANGUAGE_COOKIE, newLocale)
      document.cookie = `${LANGUAGE_COOKIE}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      document.documentElement.lang = newLocale
    } catch {
      // ignore
    }
  }

  const dict = dictionaries[locale] || dictionaries.uz

  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.')
    let current: any = dict
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return fallback ?? path
      }
    }
    return typeof current === 'string' ? current : fallback ?? path
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dict }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function useTranslation() {
  return useContext(LanguageContext)
}
