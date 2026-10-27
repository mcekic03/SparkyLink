import { normalizeDecimal } from '#/lib/money'
import type { SpreadsheetCandidate, SpreadsheetFile, SpreadsheetImportPayload } from '../types'

/** Jedan red pregleda: šta piše u fajlu prodavnice, sa cenom koju korisnik može da ispravi. */
export interface SpreadsheetRow {
  key: string
  /** Redni broj fajla iz kog je red, kroz sve do sada pročitane fajlove. */
  group: number
  /** Redni broj reda u svom fajlu (za poređenje sa ranijim uvozom). */
  line: number
  file: string
  name: string
  unit: string
  quantity: string
  /** Cena za investitora kako je upisana: `170,50`. */
  price: string
  selected: boolean
}

/** Jedan pročitani fajl: raniji uvozi sa kojima deli stavke i predlog čija je nova verzija. */
export interface SpreadsheetGroup {
  group: number
  name: string
  candidates: SpreadsheetCandidate[]
  suggested: number | null
}

export type RowStatus = 'same' | 'changed' | 'new'

/** Redovi svih pročitanih fajlova, svi izabrani. `offset` je broj ranije pročitanih fajlova. */
export function rowsFromFiles(files: SpreadsheetFile[], offset = 0): SpreadsheetRow[] {
  return files.flatMap((file, index) =>
    file.items.map((item, line) => ({
      key: `${String(offset + index)}-${String(line)}`,
      group: offset + index,
      line,
      file: file.name,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      price: item.unit_price.replace('.', ','),
      selected: true,
    })),
  )
}

export function groupsFromFiles(files: SpreadsheetFile[], offset = 0): SpreadsheetGroup[] {
  return files.map((file, index) => ({
    group: offset + index,
    name: file.name,
    candidates: file.candidates,
    suggested: file.suggested_import_id,
  }))
}

/** Stanje reda prema izabranom ranijem uvozu; kao nov dokument, sve je novo. */
export function rowMatch(
  row: Pick<SpreadsheetRow, 'line'>,
  group: SpreadsheetGroup | undefined,
  target: number | null,
): { status: RowStatus; previous: SpreadsheetCandidate['rows'][number]['previous'] } {
  const candidate = target === null ? undefined : group?.candidates.find((option) => option.import_id === target)
  const match = candidate?.rows[row.line]

  return match ? { status: match.status, previous: match.previous } : { status: 'new', previous: null }
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

/**
 * Izabrani redovi po fajlu iz kog su; fajl sa izabranim ranijim uvozom ide kao njegova nova
 * verzija (backend preskače iste, menja izmenjene, dodaje nove). Prazni fajlovi otpadaju.
 */
export function importPayload(
  rows: SpreadsheetRow[],
  day: string,
  targets: ReadonlyMap<number, number | null> = new Map(),
): SpreadsheetImportPayload {
  const files = new Map<number, SpreadsheetImportPayload['files'][number]>()

  for (const row of rows.filter((candidate) => candidate.selected)) {
    const file = files.get(row.group) ?? { name: row.file, merge_into: targets.get(row.group) ?? null, items: [] }
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
