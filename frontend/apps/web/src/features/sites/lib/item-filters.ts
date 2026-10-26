import { ItemType } from '../types'
import type { SiteItem } from '../types'

/** Kako je stavka uneta: ručno, iz Excel fajla prodavnice ili sa fiskalnog računa (QR). */
export type ItemSource = 'manual' | 'import' | 'receipt'

export type SourceFilter = 'all' | ItemSource

export interface ItemFilters {
  /** Otvorena kartica stavki; bez nje sve stavke. */
  type: ItemType | undefined
  search: string
  source: SourceFilter
}

export const SOURCES: ReadonlyArray<SourceFilter> = ['all', 'manual', 'import', 'receipt']

export function itemSource(item: SiteItem): ItemSource {
  if (item.receipt_id !== null) return 'receipt'
  if (item.item_import_id !== null) return 'import'
  return 'manual'
}

/** Usluge se unose samo ručno, pa za njih nema filtera po izvoru, samo pretraga. */
export function hasSourceFilter(type: ItemType | undefined): boolean {
  return type !== ItemType.Service
}

/** Mala slova i bez kvačica, da „uticnica“ nađe „Utičnica“. */
function normalized(text: string): string {
  return text
    .toLocaleLowerCase('sr-Latn')
    .replaceAll('đ', 'dj')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Stavke otvorene kartice koje odgovaraju pretrazi po nazivu i izvoru. */
export function filterItems(items: SiteItem[], { type, search, source }: ItemFilters): SiteItem[] {
  const needle = normalized(search.trim())
  const bySource = hasSourceFilter(type) && source !== 'all'

  return items.filter(
    (item) =>
      (type === undefined || item.type === type) &&
      (needle === '' || normalized(item.name).includes(needle)) &&
      (!bySource || itemSource(item) === source),
  )
}

/** Koliko stavki otvorene kartice ima po izvoru, za brojke u filteru. */
export function sourceCounts(items: SiteItem[], type: ItemType | undefined): Record<SourceFilter, number> {
  const counts: Record<SourceFilter, number> = { all: 0, manual: 0, import: 0, receipt: 0 }

  for (const item of items) {
    if (type !== undefined && item.type !== type) continue
    counts.all++
    counts[itemSource(item)]++
  }

  return counts
}
