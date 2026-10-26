import { describe, expect, it } from 'vitest'
import { Currency } from '#/types/money'
import {
  formatAmount,
  formatQuantity,
  isPositiveDecimal,
  normalizeDecimal,
} from './money'

describe('money helpers', () => {
  it('formats amounts the Serbian way, with the currency symbol', () => {
    expect(formatAmount('1234.5', Currency.EUR)).toBe('1.234,50 €')
    expect(formatAmount('85', Currency.RSD)).toBe('85,00 din')
  })

  it('drops trailing zeros from quantities', () => {
    expect(formatQuantity('10.000')).toBe('10')
    expect(formatQuantity('2.500')).toBe('2,5')
  })

  it('understands a decimal comma from a phone keyboard', () => {
    expect(normalizeDecimal('12,5')).toBe('12.5')
    expect(normalizeDecimal('1.234,56')).toBe('1234.56')
    expect(normalizeDecimal(' 7 ')).toBe('7')
    expect(normalizeDecimal('abc')).toBeNull()
    expect(isPositiveDecimal('0')).toBe(false)
    expect(isPositiveDecimal('0,5')).toBe(true)
  })
})
