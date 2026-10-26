import { z } from 'zod'
import { api } from '#/lib/api'
import { paginationSchema } from '#/types/api'
import type { PaginatedResponse } from '#/types/api'
import { receiptRowSchema } from '../types'
import type { ReceiptRow, ReceiptsParams } from '../types'

const receiptsResponseSchema = z.object({ data: z.array(receiptRowSchema), pagination: paginationSchema })

export async function fetchReceipts(params: ReceiptsParams): Promise<PaginatedResponse<ReceiptRow>> {
  const response = await api.get<unknown>('/api/admin/receipts', { params })
  return receiptsResponseSchema.parse(response.data)
}
