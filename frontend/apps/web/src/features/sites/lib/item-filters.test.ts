import { describe, expect, it } from 'vitest'
import { Currency } from '#/types/money'
import { ItemType } from '../types'
import type { SiteItem } from '../types'
import { filterItems, itemSource, sourceCounts } from './item-filters'

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

const manualCable = item({ name: 'Kabl PP-Y 3x2,5' })
const importedSocket = item({ name: 'Utičnica šuko bela', item_import_id: 3 })
const receiptTape = item({ name: 'Izolir traka', receipt_id: 8 })
const fuel = item({ name: 'Gorivo', type: ItemType.Other, receipt_id: 9 })
const service = item({ name: 'Ugradnja utičnice', type: ItemType.Service })
const all = [manualCable, importedSocket, receiptTape, fuel, service]

const names = (items: SiteItem[]) => items.map((candidate) => candidate.name)

describe('items tab filters', () => {
  it('knows where each item came from', () => {
    expect([manualCable, importedSocket, receiptTape].map(itemSource)).toEqual(['manual', 'import', 'receipt'])
  })

  it('searches names without caring about case or Serbian letters', () => {
    expect(names(filterItems(all, { type: undefined, search: 'UTICNIC', source: 'all' }))).toEqual([
      'Utičnica šuko bela',
      'Ugradnja utičnice',
    ])
  })

  it('applies the search and the source only inside the open kind of items', () => {
    expect(names(filterItems(all, { type: ItemType.Material, search: 'utič', source: 'all' }))).toEqual(['Utičnica šuko bela'])
    expect(names(filterItems(all, { type: undefined, search: '', source: 'receipt' }))).toEqual(['Izolir traka', 'Gorivo'])
    expect(names(filterItems(all, { type: ItemType.Other, search: '', source: 'receipt' }))).toEqual(['Gorivo'])
    expect(names(filterItems(all, { type: ItemType.Material, search: '', source: 'manual' }))).toEqual(['Kabl PP-Y 3x2,5'])
  })

  it('has no source filter for services, only the search', () => {
    expect(names(filterItems(all, { type: ItemType.Service, search: '', source: 'import' }))).toEqual(['Ugradnja utičnice'])
  })

  it('counts the sources of the open kind of items', () => {
    expect(sourceCounts(all, ItemType.Material)).toEqual({ all: 3, manual: 1, import: 1, receipt: 1 })
    expect(sourceCounts(all, undefined)).toEqual({ all: 5, manual: 2, import: 1, receipt: 2 })
  })
})
