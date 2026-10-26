import z from 'zod'
import type { TFunction } from 'i18next'
import { isNonNegativeDecimal, isPositiveDecimal } from '#/lib/money'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Empty means "use the NBS rate of the day"; otherwise a positive number. */
function rateField(t: TFunction) {
  return z.string().refine((value) => value.trim() === '' || isPositiveDecimal(value), t('items.errors.rate'))
}

export function itemFormSchema(t: TFunction) {
  return z.object({
    type: z.string().min(1),
    currency: z.string().min(1),
    name: z.string().trim().min(1, t('items.errors.name')),
    unit: z.string(),
    quantity: z.string().refine(isPositiveDecimal, t('items.errors.quantity')),
    purchase_price: z.string().refine((value) => value.trim() === '' || isNonNegativeDecimal(value), t('items.errors.price')),
    sale_price: z.string().refine((value) => value.trim() === '' || isNonNegativeDecimal(value), t('items.errors.price')),
    occurred_at: z.string().regex(ISO_DAY, t('items.errors.date')),
    exchange_rate: rateField(t),
    note: z.string(),
    is_billable: z.boolean(),
  })
}

export function laborFormSchema(t: TFunction) {
  return z.object({
    currency: z.string().min(1),
    workers_count: z.string().refine((value) => /^\d+$/.test(value.trim()) && Number(value) >= 1, t('labor.errors.workers')),
    hours: z.string().refine((value) => isPositiveDecimal(value) && Number(value.replace(',', '.')) <= 24, t('labor.errors.hours')),
    hourly_rate: z.string().refine(isNonNegativeDecimal, t('labor.errors.hourlyRate')),
    worked_at: z.string().regex(ISO_DAY, t('items.errors.date')),
    exchange_rate: rateField(t),
    description: z.string(),
  })
}

export function paymentFormSchema(t: TFunction) {
  return z.object({
    currency: z.string().min(1),
    amount: z.string().refine(isPositiveDecimal, t('payments.errors.amount')),
    paid_at: z.string().regex(ISO_DAY, t('items.errors.date')),
    exchange_rate: rateField(t),
    note: z.string(),
  })
}

export function documentFormSchema(t: TFunction) {
  return z.object({
    issued_at: z.string().regex(ISO_DAY, t('items.errors.date')),
    note: z.string(),
    is_itemized: z.boolean(),
  })
}
