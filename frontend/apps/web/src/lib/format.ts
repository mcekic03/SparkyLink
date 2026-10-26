/**
 * Formatting helpers for the things the API sends as strings: ISO days
 * (`yyyy-mm-dd`) and decimal amounts.
 */

/** `2027-07-01` → `01.07.2027.` (Serbian convention, also readable in English). */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}.${month}.${year}.`
}

/** `2027-07-01` → `01.07.` */
export function formatDayShort(iso: string): string {
  const [, month, day] = iso.split('-')
  if (!month || !day) return iso
  return `${day}.${month}.`
}

/** `42.5` + `EUR` → `42,50 €`; whole amounts drop the decimals. Other currencies keep their code. */
export function formatMoney(amount: number, currency: string): string {
  const cents = Math.round(amount * 100)
  const hasCents = cents % 100 !== 0
  const text = (cents / 100).toLocaleString('sr-Latn-RS', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
  const symbol = currency.toUpperCase() === 'EUR' ? '€' : currency
  return `${text} ${symbol}`
}

/** `2.5` → `2,5`, `3` → `3` (billed persons, child factors). */
export function formatNumber(value: number): string {
  return value.toLocaleString('sr-Latn-RS', { maximumFractionDigits: 2 })
}

/** Local calendar day of a Date as `yyyy-mm-dd`, without the UTC shift of toISOString(). */
export function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(date.getFullYear())}-${month}-${day}`
}

export function fromIsoDay(iso: string): Date | undefined {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function addDaysIso(iso: string, days: number): string {
  const date = fromIsoDay(iso)
  if (!date) return iso
  date.setDate(date.getDate() + days)
  return toIsoDay(date)
}

export function todayIso(): string {
  return toIsoDay(new Date())
}

/** Nights between two ISO days; 0 when the order is wrong. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = fromIsoDay(checkIn)
  const end = fromIsoDay(checkOut)
  if (!start || !end) return 0
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return diff > 0 ? diff : 0
}

/** Every night of a stay as ISO days: check-in inclusive, check-out exclusive. */
export function nightsOfStay(checkIn: string, checkOut: string): string[] {
  const nights: string[] = []
  let cursor = checkIn
  while (cursor < checkOut && nights.length < 400) {
    nights.push(cursor)
    cursor = addDaysIso(cursor, 1)
  }
  return nights
}

/** Every day from `from` to `to`, both inclusive. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = []
  let cursor = from
  while (cursor <= to && days.length < 800) {
    days.push(cursor)
    cursor = addDaysIso(cursor, 1)
  }
  return days
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('sr-Latn-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
