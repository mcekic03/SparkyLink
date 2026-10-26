import { ItemType } from '../types'
import type { SiteItem } from '../types'

/**
 * Stavka uvezena iz Excel-a prodavnice zadržava procenjenu nabavnu cenu (jednaku ceni za
 * investitora, pa bez zarade) dok se u prazno polje ne upiše prava.
 */
export function keepsPurchaseEstimate(
  item: Pick<SiteItem, 'is_purchase_estimated'> | undefined,
  type: ItemType,
  purchaseInput: string,
): boolean {
  return item?.is_purchase_estimated === true && type !== ItemType.Service && purchaseInput.trim() === ''
}

/** Materijal kome je nabavna cena još procena ili je ostala 0. */
export function purchaseMissing(item: Pick<SiteItem, 'type' | 'purchase_price' | 'is_purchase_estimated'>): boolean {
  return item.type === ItemType.Material && (item.is_purchase_estimated || Number(item.purchase_price) === 0)
}
