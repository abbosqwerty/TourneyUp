export type Locale = 'uz' | 'ru' | 'en'

export interface LocaleOption {
  code: Locale
  label: string
  shortLabel: string
  flag: string
}

export const LOCALES: LocaleOption[] = [
  { code: 'uz', label: 'O‘zbekcha', shortLabel: 'UZ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', shortLabel: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
]

export const DEFAULT_LOCALE: Locale = 'uz'

export const LANGUAGE_COOKIE = 'tourneyup_lang'

export function isLocale(value: unknown): value is Locale {
  return value === 'uz' || value === 'ru' || value === 'en'
}
