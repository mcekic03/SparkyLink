import { adminKeys } from '#/lib/query-keys'
import type { SitesParams } from '../types'

/**
 * Every query key for this domain. They nest under `adminKeys.sites`, so
 * invalidating that root (as other features do after a money change) reaches
 * every list, detail and tab below it.
 */
export const sitesKeys = {
  all: adminKeys.sites,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (params: SitesParams) => [...sitesKeys.lists(), params] as const,
  detail: (id: number) => [...sitesKeys.all, 'detail', id] as const,
  summary: (id: number) => [...sitesKeys.detail(id), 'summary'] as const,
  items: (id: number) => [...sitesKeys.detail(id), 'items'] as const,
  labor: (id: number) => [...sitesKeys.detail(id), 'labor'] as const,
  payments: (id: number) => [...sitesKeys.detail(id), 'payments'] as const,
  documents: (id: number) => [...sitesKeys.detail(id), 'documents'] as const,
  notes: (id: number) => [...sitesKeys.detail(id), 'notes'] as const,
  media: (id: number) => [...sitesKeys.detail(id), 'media'] as const,
  receipts: (id: number) => [...sitesKeys.detail(id), 'receipts'] as const,
  receipt: (id: number) => [...sitesKeys.all, 'receipt', id] as const,
  exchangeRate: (day: string) => [...adminKeys.exchangeRates, day] as const,
  suggestions: (search: string, type?: number) => [...sitesKeys.all, 'suggestions', search, type] as const,
}
