import { z } from 'zod'
import { api } from '#/lib/api'

export const settingsSchema = z.object({
  company_name: z.string(),
  company_address: z.string(),
  company_city: z.string(),
  company_phone: z.string(),
  company_email: z.string(),
  company_pib: z.string(),
  company_mb: z.string(),
  company_bank_account: z.string(),
  company_website: z.string(),
  default_currency: z.number(),
  default_markup_percent: z.string(),
  offer_note: z.string(),
  invoice_note: z.string(),
  logo_url: z.string(),
})

export type Settings = z.infer<typeof settingsSchema>
export type SettingsPayload = Omit<Settings, 'logo_url'>

const settingsResponseSchema = z.object({ message: z.string().optional(), data: settingsSchema })

/** Mirrors `App\Enums\ExchangeRateSource`. */
export enum RateSource {
  Nbs = 1,
  Manual = 2,
}

export const exchangeRateSchema = z.object({
  id: z.number(),
  source: z.enum(RateSource),
  rate: z.string(),
  effective_at: z.string(),
})

export type ExchangeRate = z.infer<typeof exchangeRateSchema>

export async function fetchSettings(): Promise<Settings> {
  const response = await api.get<unknown>('/api/admin/settings')
  return settingsResponseSchema.parse(response.data).data
}

export async function updateSettings(payload: SettingsPayload) {
  const response = await api.put<unknown>('/api/admin/settings', payload)
  return settingsResponseSchema.parse(response.data)
}

export async function uploadLogo(file: File) {
  const form = new FormData()
  form.append('logo', file)
  const response = await api.post<unknown>('/api/admin/settings/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return settingsResponseSchema.parse(response.data)
}

export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const response = await api.get<unknown>('/api/admin/exchange-rates')
  return z.object({ data: z.array(exchangeRateSchema) }).parse(response.data).data
}

export async function saveExchangeRate(effectiveAt: string, rate: string) {
  const response = await api.post<unknown>('/api/admin/exchange-rates', { effective_at: effectiveAt, rate })
  return z.object({ message: z.string(), data: exchangeRateSchema }).parse(response.data)
}
