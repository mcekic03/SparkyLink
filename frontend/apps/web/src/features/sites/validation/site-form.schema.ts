import z from 'zod'
import type { TFunction } from 'i18next'
import { isNonNegativeDecimal } from '#/lib/money'

export function siteFormSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(2, t('sites.form.errors.name')),
    status: z.string().min(1),
    currency: z.string().min(1),
    address: z.string(),
    city: z.string(),
    investor_name: z.string(),
    investor_phone: z.string(),
    investor_email: z
      .string()
      .trim()
      .refine((value) => value === '' || z.email().safeParse(value).success, t('sites.form.errors.email')),
    investor_address: z.string(),
    description: z.string(),
    markup_percent: z
      .string()
      .refine((value) => value.trim() === '' || isNonNegativeDecimal(value), t('sites.form.errors.markup')),
    started_at: z.string(),
    completed_at: z.string(),
  })
}

export type SiteFormValues = z.infer<ReturnType<typeof siteFormSchema>>
