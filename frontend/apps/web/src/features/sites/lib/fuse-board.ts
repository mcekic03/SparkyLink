import { FuseType } from '../types'
import type { FuseBoard, FuseBoardPayload } from '../types'

/** Jedan red u spisku osigurača; redni broj na tabli je njegovo mesto u spisku. */
export interface FuseRow {
  /** Stalni ključ reda, da pomeren red zadrži ono što je u njega upisano. */
  key: string
  name: string
  type: FuseType
  rating: number
}

let lastKey = 0

function nextKey(): string {
  lastKey += 1
  return `fuse-${String(lastKey)}`
}

export function rowsFromBoard(board: FuseBoard): FuseRow[] {
  return board.fuses.map((fuse) => ({ key: nextKey(), name: fuse.name, type: fuse.type, rating: fuse.rating }))
}

/** Novi osigurač dobija tip i jačinu prethodnog (na tabli ih ima više istih); prvi je B16. */
export function newFuseRow(rows: FuseRow[]): FuseRow {
  const last = rows.at(-1)

  return { key: nextKey(), name: '', type: last?.type ?? FuseType.B, rating: last?.rating ?? 16 }
}

export function updateRow(rows: FuseRow[], index: number, patch: Partial<Omit<FuseRow, 'key'>>): FuseRow[] {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
}

/** Pomera osigurač za jedno mesto gore (-1) ili dole (1); prvi i poslednji ostaju na kraju spiska. */
export function moveRow(rows: FuseRow[], index: number, offset: -1 | 1): FuseRow[] {
  const target = index + offset
  if (target < 0 || target >= rows.length) return rows

  const moved = [...rows]
  ;[moved[index], moved[target]] = [moved[target], moved[index]]
  return moved
}

export function removeRow(rows: FuseRow[], index: number): FuseRow[] {
  return rows.filter((_, i) => i !== index)
}

/** Ono što server čuva: nazivi bez razmaka na krajevima, redom kao na tabli. */
export function boardPayload(name: string, rows: FuseRow[]): FuseBoardPayload {
  return {
    name: name.trim(),
    fuses: rows.map((row) => ({ name: row.name.trim(), type: row.type, rating: row.rating })),
  }
}

/** Da li se spisak razlikuje od sačuvanog (razmaci na krajevima naziva se ne računaju). */
export function isBoardChanged(board: FuseBoard, rows: FuseRow[]): boolean {
  if (rows.length !== board.fuses.length) return true

  return rows.some((row, i) => {
    const saved = board.fuses[i]
    return row.name.trim() !== saved.name || row.type !== saved.type || row.rating !== saved.rating
  })
}

/** Redni brojevi osigurača kojima još nije upisano šta napajaju. */
export function unnamedFuses(rows: FuseRow[]): number[] {
  return rows.flatMap((row, i) => (row.name.trim() === '' ? [i + 1] : []))
}
