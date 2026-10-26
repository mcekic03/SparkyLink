import { Currency } from '#/types/money'

/**
 * Money helpers. Amounts arrive from the API as decimal strings; they are only
 * formatted here, never summed in floating point (the backend does the math).
 */

const SYMBOL: Record<Currency, string> = {
  [Currency.RSD]: 'din',
  [Currency.EUR]: '€',
}

export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency]
}

/** `1234.5` + EUR → `1.234,50 €`; RSD → `1.234,50 din`. */
export function formatAmount(
  value: string | number | null | undefined,
  currency: Currency,
): string {
  const number = typeof value === 'number' ? value : Number(value ?? 0)
  const text = (Number.isFinite(number) ? number : 0).toLocaleString('sr-Latn-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${text} ${SYMBOL[currency]}`
}

/** `10.000` → `10`, `2.500` → `2,5`. */
export function formatQuantity(value: string | number): string {
  const number = typeof value === 'number' ? value : Number(value)
  return (Number.isFinite(number) ? number : 0).toLocaleString('sr-Latn-RS', {
    maximumFractionDigits: 3,
  })
}

/** `117.3456` → `117,3456`. */
export function formatRate(value: string | number | null | undefined): string {
  const number = Number(value ?? 0)
  return number.toLocaleString('sr-Latn-RS', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

/**
 * A number typed on a phone with a Serbian keyboard: `12,5`, `1.234,56`, ` 7 `.
 * Returns a dot-decimal string the API accepts, or null when it is not a number.
 */
export function normalizeDecimal(input: string): string | null {
  let value = input.replace(/[\s  ]/g, '')
  if (value === '') return null

  if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.')
  }

  return /^-?\d+(\.\d+)?$/.test(value) ? value : null
}

export function isPositiveDecimal(input: string): boolean {
  const value = normalizeDecimal(input)
  return value !== null && Number(value) > 0
}

export function isNonNegativeDecimal(input: string): boolean {
  const value = normalizeDecimal(input)
  return value !== null && Number(value) >= 0
}

export function isNegative(value: string | number): boolean {
  return Number(value) < 0
}
