import z from 'zod'
import type { TFunction } from 'i18next'
import { isNonNegativeDecimal } from '#/lib/money'

export function settingsFormSchema(t: TFunction) {
  return z.object({
    company_name: z.string().trim().min(1, t('sites.form.errors.name')),
    company_address: z.string(),
    company_city: z.string(),
    company_phone: z.string(),
    company_email: z.string().refine((value) => value.trim() === '' || z.email().safeParse(value.trim()).success, t('sites.form.errors.email')),
    company_pib: z.string(),
    company_mb: z.string(),
    company_bank_account: z.string(),
    company_website: z.string(),
    default_currency: z.string().min(1),
    default_markup_percent: z.string().refine(isNonNegativeDecimal, t('sites.form.errors.markup')),
    offer_note: z.string(),
    invoice_note: z.string(),
  })
}
