import { describe, expect, it } from 'vitest'
import { Currency } from '#/types/money'
import { ItemType, PaymentStatus } from '../types'
import type { SiteSummary } from '../types'
import { itemTotalsFor } from './item-totals'

const pair = (eur: string) => ({ eur, rsd: String(Number(eur) * 117) })

const summary: SiteSummary = {
  currency: Currency.EUR,
  exchange_rate_today: '117.0000',
  billed: pair('215.00'),
  costs: pair('88.38'),
  profit: pair('126.62'),
  paid: pair('100.00'),
  balance: { amount: '115.00', currency: Currency.EUR, other_amount: '13455.00' },
  payment_status: PaymentStatus.PartiallyPaid,
  materials: { purchase: pair('10.00'), sale: pair('15.00'), margin: pair('5.00') },
  services: { sale: pair('200.00') },
  other: { purchase: pair('3.00'), sale: pair('0.00') },
  labor: { cost: pair('68.38'), person_hours: '16.00' },
  items: { purchase: pair('13.00') },
}

const eurOf = (type: ItemType | undefined) =>
  itemTotalsFor(summary, type).map((total) => [total.key, total.pair.eur])

describe('item totals for the chosen kind of items', () => {
  it('shows what material cost so far and what the investor owes for it', () => {
    expect(eurOf(ItemType.Material)).toEqual([
      ['spent', '10.00'],
      ['owed', '15.00'],
    ])
  })

  it('shows only what the investor owes for services, which have no purchase price', () => {
    expect(eurOf(ItemType.Service)).toEqual([['owed', '200.00']])
  })

  it('shows the cost and the charge of other items', () => {
    expect(eurOf(ItemType.Other)).toEqual([
      ['spent', '3.00'],
      ['owed', '0.00'],
    ])
  })

  it('shows the purchase of every item and everything billed when nothing is filtered', () => {
    expect(eurOf(undefined)).toEqual([
      ['spent', '13.00'],
      ['owed', '215.00'],
    ])
  })
})
