/**
 * Kartice stranice gradilišta. Stoje u posebnom malom fajlu jer ih ruta koristi za proveru
 * adrese: da ih uzima iz stranice, cela stranica (sa svim karticama) bi ušla u početni paket.
 */
export const SITE_TABS = ['overview', 'items', 'labor', 'payments', 'documents', 'receipts', 'media', 'notes'] as const

export type SiteTab = (typeof SITE_TABS)[number]
