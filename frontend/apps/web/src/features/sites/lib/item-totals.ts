import type { MoneyPair } from '#/types/money'
import { ItemType } from '../types'
import type { SiteSummary } from '../types'

export interface ItemTotal {
  /** `spent`: koliko su stavke do sada koštale (nabavno); `owed`: koliko se naplaćuje investitoru. */
  key: 'spent' | 'owed'
  /** Ključ prevoda natpisa; usluge nemaju `spent`. */
  label: `items.totals.${'spent' | 'owed'}.${'all' | '1' | '3'}` | 'items.totals.owed.2'
  pair: MoneyPair
}

// Svaka vrsta stavki mora da bude navedena, da nova vrsta ne bi tiho ostala bez zbirova.
const BY_TYPE: Record<ItemType, (summary: SiteSummary) => ItemTotal[]> = {
  [ItemType.Material]: (summary) => [
    { key: 'spent', label: 'items.totals.spent.1', pair: summary.materials.purchase },
    { key: 'owed', label: 'items.totals.owed.1', pair: summary.materials.sale },
  ],
  [ItemType.Service]: (summary) => [{ key: 'owed', label: 'items.totals.owed.2', pair: summary.services.sale }],
  [ItemType.Other]: (summary) => [
    { key: 'spent', label: 'items.totals.spent.3', pair: summary.other.purchase },
    { key: 'owed', label: 'items.totals.owed.3', pair: summary.other.sale },
  ],
}

/**
 * Zbirovi za vrstu stavki koja se gleda, iz obračuna gradilišta koji računa backend.
 * Usluge nemaju nabavnu cenu, pa se za njih vidi samo koliko investitor duguje.
 */
export function itemTotalsFor(summary: SiteSummary, type: ItemType | undefined): ItemTotal[] {
  if (type !== undefined) return BY_TYPE[type](summary)

  return [
    { key: 'spent', label: 'items.totals.spent.all', pair: summary.items.purchase },
    { key: 'owed', label: 'items.totals.owed.all', pair: summary.billed },
  ]
}
