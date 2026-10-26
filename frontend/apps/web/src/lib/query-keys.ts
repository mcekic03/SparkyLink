/**
 * Query keys shared by several features. A feature may not import another
 * feature, yet adding an item on a site must refresh the dashboard and the
 * site list too — so the roots live here and every feature invalidates through
 * them.
 */
export const adminKeys = {
  sites: ['admin', 'sites'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  receipts: ['admin', 'receipts'] as const,
  priceList: ['admin', 'price-list'] as const,
  settings: ['admin', 'settings'] as const,
  exchangeRates: ['admin', 'exchange-rates'] as const,
}

/** Everything a money change on a site can affect. */
export const MONEY_DEPENDENT_KEYS = [adminKeys.sites, adminKeys.dashboard] as const
