import { z } from 'zod'
import { api } from '#/lib/api'
import { messageResponseSchema, paginationSchema } from '#/types/api'
import type { PaginatedResponse } from '#/types/api'
import { priceListItemSchema } from '../types'
import type { PriceListItem, PriceListParams, PriceListPayload } from '../types'

const listSchema = z.object({ data: z.array(priceListItemSchema), pagination: paginationSchema })
const itemResponseSchema = z.object({ message: z.string().optional(), data: priceListItemSchema })

export async function fetchPriceList(params: PriceListParams): Promise<PaginatedResponse<PriceListItem>> {
  const response = await api.get<unknown>('/api/admin/price-list-items', { params })
  return listSchema.parse(response.data)
}

export async function savePriceListItem(payload: PriceListPayload, id?: number) {
  const response = id
    ? await api.put<unknown>(`/api/admin/price-list-items/${String(id)}`, payload)
    : await api.post<unknown>('/api/admin/price-list-items', payload)
  return itemResponseSchema.parse(response.data)
}

export async function deletePriceListItem(id: number) {
  const response = await api.delete<unknown>(`/api/admin/price-list-items/${String(id)}`)
  return messageResponseSchema.parse(response.data)
}
