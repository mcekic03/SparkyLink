import { normalizeDecimal } from '#/lib/money'
import type { MoneyPair } from '#/types/money'
import { ItemType } from '../types'
import type { SiteItem } from '../types'

/** Jedan uvezen Excel fajl i njegove stavke na gradilištu. */
export interface ImportBatch {
  id: number
  fileName: string
  createdAt: string
  ids: number[]
}

/** Usluge nemaju nabavnu cenu, pa se ne biraju za nju. */
export function canHavePurchase(item: SiteItem): boolean {
  return item.type !== ItemType.Service
}

/** Uvozi iz kojih su stavke, najnoviji prvi. */
export function importBatches(items: SiteItem[]): ImportBatch[] {
  const batches = new Map<number, ImportBatch>()

  for (const item of items) {
    if (!item.item_import) continue
    const batch = batches.get(item.item_import.id) ?? {
      id: item.item_import.id,
      fileName: item.item_import.file_name,
      createdAt: item.item_import.created_at,
      ids: [],
    }
    batch.ids.push(item.id)
    batches.set(batch.id, batch)
  }

  return [...batches.values()].toSorted((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
}

const cents = (value: string) => Math.round(Number(value) * 100)
const amount = (total: number) => (total / 100).toFixed(2)

/**
 * Zbir izabranih stavki (za investitora i nabavno), u obe valute. Iznosi sa API-ja imaju
 * dve decimale, pa je zbir u celim parama tačan; služi samo za prikaz.
 */
export function selectionSums(items: SiteItem[], ids: ReadonlySet<number>): { count: number; sale: MoneyPair; purchase: MoneyPair } {
  const chosen = items.filter((item) => ids.has(item.id))
  const sum = (field: 'sale_total_rsd' | 'sale_total_eur' | 'purchase_total_rsd' | 'purchase_total_eur') =>
    amount(chosen.reduce((total, item) => total + cents(item[field]), 0))

  return {
    count: chosen.length,
    sale: { rsd: sum('sale_total_rsd'), eur: sum('sale_total_eur') },
    purchase: { rsd: sum('purchase_total_rsd'), eur: sum('purchase_total_eur') },
  }
}

/** Za koliko procenata je plaćeni iznos manji od cene za investitora (samo za prikaz). */
export function paidPercentLower(paid: string, sale: string): number | null {
  const value = normalizeDecimal(paid)
  if (value === null || !(Number(sale) > 0)) return null

  return Math.round((1 - Number(value) / Number(sale)) * 10000) / 100
}
