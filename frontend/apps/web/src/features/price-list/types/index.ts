import { z } from 'zod'
import { Currency } from '#/types/money'

/** Mirrors `App\Enums\ItemType` (the price list offers the same kinds of items). */
export enum PriceItemType {
  Material = 1,
  Service = 2,
  Other = 3,
}

export const priceListItemSchema = z.object({
  id: z.number(),
  type: z.enum(PriceItemType),
  currency: z.enum(Currency),
  name: z.string(),
  unit: z.string(),
  purchase_price: z.string().nullable(),
  sale_price: z.string().nullable(),
  is_active: z.boolean(),
})

export type PriceListItem = z.infer<typeof priceListItemSchema>

export interface PriceListParams {
  page?: number
  search?: string
  type?: PriceItemType
}

export interface PriceListPayload {
  type: PriceItemType
  currency: Currency
  name: string
  unit: string
  purchase_price: string | null
  sale_price: string | null
  is_active: boolean
}

export function parsePriceItemType(value: string | number | undefined): PriceItemType | undefined {
  const result = z.enum(PriceItemType).safeParse(Number(value))
  return result.success ? result.data : undefined
}
