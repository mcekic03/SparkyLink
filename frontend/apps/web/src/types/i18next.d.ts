import type en from '#/locales/en.json'

// Makes t() keys typechecked against en.json, so a typo or a removed key is a
// compile error rather than a raw key rendered on screen.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
