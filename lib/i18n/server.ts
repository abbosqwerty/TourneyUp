import 'server-only'
import { cookies } from 'next/headers'
import { dictionaries } from './dictionaries'
import { DEFAULT_LOCALE, LANGUAGE_COOKIE, isLocale, type Locale } from './types'

/** The visitor's language, from the cookie the language switcher writes. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LANGUAGE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Translations for server components, server actions and metadata:
 *   const { dict, locale } = await getI18n()
 */
export async function getI18n() {
  const locale = await getLocale()
  return { locale, dict: dictionaries[locale] }
}
