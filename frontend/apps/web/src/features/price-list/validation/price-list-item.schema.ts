import z from 'zod'
import type { TFunction } from 'i18next'
import { isNonNegativeDecimal } from '#/lib/money'

export function priceListItemSchema(t: TFunction) {
  const optionalPrice = z.string().refine((value) => value.trim() === '' || isNonNegativeDecimal(value), t('items.errors.price'))

  return z.object({
    type: z.string().min(1),
    currency: z.string().min(1),
    name: z.string().trim().min(1, t('items.errors.name')),
    unit: z.string(),
    purchase_price: optionalPrice,
    sale_price: optionalPrice,
    is_active: z.boolean(),
  })
}
