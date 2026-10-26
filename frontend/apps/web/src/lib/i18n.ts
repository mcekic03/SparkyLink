import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '#/locales/en.json'
import sr from '#/locales/sr.json'

export const LOCALES = ['en', 'sr'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'sr'

const LOCALE_STORAGE_KEY = 'app.locale'

// Bundled rather than fetched: two small locale files, and a network round-trip
// would put a loading state in front of the whole app.
const resources = {
  en: { translation: en },
  sr: { translation: sr },
}

await i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    // Otherwise `sr-Latn-RS` from the browser would miss `sr` entirely.
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React escapes for us.
      escapeValue: false,
    },
  })

export function isLocale(value: string): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

/** Synchronous, for callers outside React such as the request interceptor. */
export function currentLocale(): Locale {
  const resolved = i18n.resolvedLanguage ?? i18n.language
  return isLocale(resolved) ? resolved : DEFAULT_LOCALE
}

export function setLocale(locale: Locale): Promise<unknown> {
  return i18n.changeLanguage(locale)
}

export { i18n }
