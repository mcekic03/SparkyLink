import { describe, expect, it } from 'vitest'
import { ItemType } from '../types'
import { keepsPurchaseEstimate, purchaseMissing } from './purchase-estimate'

describe('estimated purchase price', () => {
  it('stays an estimate while the purchase field of an estimated item is left empty', () => {
    expect(keepsPurchaseEstimate({ is_purchase_estimated: true }, ItemType.Material, '  ')).toBe(true)
  })

  it('becomes a real price as soon as one is typed', () => {
    expect(keepsPurchaseEstimate({ is_purchase_estimated: true }, ItemType.Material, '150,00')).toBe(false)
  })

  it('never applies to items that were not estimated, nor to services', () => {
    expect(keepsPurchaseEstimate({ is_purchase_estimated: false }, ItemType.Material, '')).toBe(false)
    expect(keepsPurchaseEstimate(undefined, ItemType.Material, '')).toBe(false)
    expect(keepsPurchaseEstimate({ is_purchase_estimated: true }, ItemType.Service, '')).toBe(false)
  })

  it('flags material whose purchase price was never entered', () => {
    expect(purchaseMissing({ type: ItemType.Material, purchase_price: '170.00', is_purchase_estimated: true })).toBe(true)
    expect(purchaseMissing({ type: ItemType.Material, purchase_price: '0.00', is_purchase_estimated: false })).toBe(true)
    expect(purchaseMissing({ type: ItemType.Material, purchase_price: '150.00', is_purchase_estimated: false })).toBe(false)
    expect(purchaseMissing({ type: ItemType.Service, purchase_price: '0.00', is_purchase_estimated: false })).toBe(false)
  })
})
