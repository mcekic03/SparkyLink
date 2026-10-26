import { z } from 'zod'

/** Mirrors `App\Enums\Currency`. Amounts travel as decimal strings ("117.35"). */
export enum Currency {
  RSD = 1,
  EUR = 2,
}

export const moneyPairSchema = z.object({
  rsd: z.string(),
  eur: z.string(),
})

/** The same amount in both currencies, each at the rate of its own day. */
export type MoneyPair = z.infer<typeof moneyPairSchema>

export const CURRENCY_VALUES = [Currency.EUR, Currency.RSD] as const

export function otherCurrency(currency: Currency): Currency {
  return currency === Currency.EUR ? Currency.RSD : Currency.EUR
}

export function pairValue(pair: MoneyPair, currency: Currency): string {
  return currency === Currency.EUR ? pair.eur : pair.rsd
}

export function parseCurrency(value: string | number | undefined): Currency | undefined {
  const result = z.enum(Currency).safeParse(Number(value))
  return result.success ? result.data : undefined
}
