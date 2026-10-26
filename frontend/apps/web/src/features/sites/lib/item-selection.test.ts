import { describe, expect, it } from 'vitest'
import { Currency } from '#/types/money'
import { ItemType } from '../types'
import type { SiteItem } from '../types'
import { canHavePurchase, importBatches, paidPercentLower, selectionSums } from './item-selection'

let nextId = 1

function item(overrides: Partial<SiteItem>): SiteItem {
  const id = nextId++
  return {
    id,
    site_id: 4,
    receipt_id: null,
    type: ItemType.Material,
    currency: Currency.RSD,
    name: `Stavka ${String(id)}`,
    unit: 'kom',
    quantity: '1.000',
    purchase_price: '0.00',
    sale_price: '0.00',
    exchange_rate: '117.0000',
    purchase_total_rsd: '0.00',
    purchase_total_eur: '0.00',
    sale_total_rsd: '0.00',
    sale_total_eur: '0.00',
    note: null,
    is_billable: true,
    is_purchase_estimated: false,
    item_import_id: null,
    item_import: null,
    occurred_at: '2026-10-26',
    ...overrides,
  }
}

const first = { id: 7, file_name: 'elektrometal tana.xls', created_at: '2026-10-26T10:00:00Z' }
const second = { id: 9, file_name: 'druga.xls', created_at: '2026-10-27T10:00:00Z' }

describe('choosing items for the purchase price', () => {
  it('groups imported items by the file they came from, newest import first', () => {
    const items = [
      item({ item_import_id: 7, item_import: first }),
      item({ item_import_id: 9, item_import: second }),
      item({ item_import_id: 7, item_import: first }),
      item({}),
    ]

    expect(importBatches(items).map((batch) => [batch.fileName, batch.ids.length])).toEqual([
      ['druga.xls', 1],
      ['elektrometal tana.xls', 2],
    ])
  })

  it('sums the chosen items to the para in both currencies', () => {
    const items = [
      item({ sale_total_rsd: '0.10', sale_total_eur: '0.01', purchase_total_rsd: '0.10', purchase_total_eur: '0.01' }),
      item({ sale_total_rsd: '0.20', sale_total_eur: '0.02', purchase_total_rsd: '0.20', purchase_total_eur: '0.02' }),
      item({ sale_total_rsd: '5.00', sale_total_eur: '0.04' }),
    ]
    const [a, b] = items

    expect(selectionSums(items, new Set([a.id, b.id]))).toEqual({
      count: 2,
      sale: { rsd: '0.30', eur: '0.03' },
      purchase: { rsd: '0.30', eur: '0.03' },
    })
  })

  it('lets only material and other costs get a purchase price', () => {
    expect(canHavePurchase(item({ type: ItemType.Material }))).toBe(true)
    expect(canHavePurchase(item({ type: ItemType.Other }))).toBe(true)
    expect(canHavePurchase(item({ type: ItemType.Service }))).toBe(false)
  })

  it('tells how much lower than the investor price an amount paid is', () => {
    expect(paidPercentLower('900', '1000')).toBe(10)
    expect(paidPercentLower('1.000,00', '1000')).toBe(0)
    expect(paidPercentLower('abc', '1000')).toBeNull()
    expect(paidPercentLower('900', '0')).toBeNull()
  })
})
