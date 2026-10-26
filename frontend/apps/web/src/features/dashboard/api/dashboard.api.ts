import { z } from 'zod'
import { api } from '#/lib/api'
import { Currency, moneyPairSchema } from '#/types/money'

/** Mirrors `App\Enums\PaymentStatus`. */
export enum DebtorPaymentStatus {
  Unpaid = 1,
  PartiallyPaid = 2,
  Paid = 3,
}

export const dashboardSchema = z.object({
  period: z.object({ from: z.string(), to: z.string() }),
  exchange_rate_today: z.string().nullable(),
  totals: z.object({
    billed: moneyPairSchema,
    costs: moneyPairSchema,
    labor: moneyPairSchema,
    profit: moneyPairSchema,
    paid: moneyPairSchema,
  }),
  sites_by_status: z.record(z.string(), z.number()),
  receivables: z.object({
    rsd: z.string(),
    eur: z.string(),
    is_complete: z.boolean(),
    sites_count: z.number(),
  }),
  debtors: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      investor_name: z.string().nullable(),
      currency: z.enum(Currency),
      balance: z.string(),
      payment_status: z.enum(DebtorPaymentStatus),
    }),
  ),
  monthly: z.array(
    z.object({
      month: z.string(),
      billed: moneyPairSchema,
      costs: moneyPairSchema,
      profit: moneyPairSchema,
    }),
  ),
  top_sites: z.array(
    z.object({
      site_id: z.number(),
      name: z.string(),
      billed: moneyPairSchema,
      profit: moneyPairSchema,
    }),
  ),
})

export type Dashboard = z.infer<typeof dashboardSchema>

export async function fetchDashboard(params: { from?: string; to?: string }): Promise<Dashboard> {
  const response = await api.get<unknown>('/api/admin/dashboard', { params })
  return z.object({ data: dashboardSchema }).parse(response.data).data
}
