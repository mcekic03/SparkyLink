import { normalizeDecimal } from '#/lib/money'
import type { SpreadsheetFile, SpreadsheetImportPayload } from '../types'

/** Jedan red pregleda: šta piše u fajlu prodavnice, sa cenom koju korisnik može da ispravi. */
export interface SpreadsheetRow {
  key: string
  /** Redni broj fajla iz kog je red, kroz sve do sada pročitane fajlove. */
  group: number
  file: string
  name: string
  unit: string
  quantity: string
  /** Cena za investitora kako je upisana: `170,50`. */
  price: string
  selected: boolean
}

/** Redovi svih pročitanih fajlova, svi izabrani. `offset` je broj ranije pročitanih fajlova. */
export function rowsFromFiles(files: SpreadsheetFile[], offset = 0): SpreadsheetRow[] {
  return files.flatMap((file, index) =>
    file.items.map((item, line) => ({
      key: `${String(offset + index)}-${String(line)}`,
      group: offset + index,
      file: file.name,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: item.unit_price.replace('.', ','),
      selected: true,
    })),
  )
}

/**
 * Količina × cena u celim parama, samo za prikaz (pravo računanje radi backend).
 * Količina ima najviše 3 decimale, a cena 2, pa je proizvod tačan.
 */
export function lineCents(row: Pick<SpreadsheetRow, 'quantity' | 'price'>): number | null {
  const price = normalizeDecimal(row.price)
  if (price === null) return null

  return Math.round((Math.round(Number(row.quantity) * 1000) * Math.round(Number(price) * 100)) / 1000)
}

/** Zbir izabranih redova, u dinarima. */
export function selectedTotal(rows: SpreadsheetRow[]): number {
  return rows.filter((row) => row.selected).reduce((cents, row) => cents + (lineCents(row) ?? 0), 0) / 100
}

export function isRowValid(row: SpreadsheetRow): boolean {
  const price = normalizeDecimal(row.price)
  return row.name.trim() !== '' && price !== null && Number(price) >= 0
}

/** Izabrani redovi po fajlu iz kog su (svaki fajl postaje jedan uvoz); prazni fajlovi otpadaju. */
export function importPayload(rows: SpreadsheetRow[], day: string): SpreadsheetImportPayload {
  const files = new Map<number, SpreadsheetImportPayload['files'][number]>()

  for (const row of rows.filter((candidate) => candidate.selected)) {
    const file = files.get(row.group) ?? { name: row.file, items: [] }
    file.items.push({
      name: row.name.trim(),
      unit: row.unit,
      quantity: row.quantity,
      sale_price: normalizeDecimal(row.price) ?? '0',
    })
    files.set(row.group, file)
  }

  return { occurred_at: day, files: [...files.values()] }
}
