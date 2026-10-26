import { z } from 'zod'

/** Mirrors `App\Enums\ReceiptStatus`. */
export enum ReceiptRowStatus {
  Pending = 1,
  Fetched = 2,
  Failed = 3,
  Manual = 4,
}

/** A receipt as the search list shows it (the detail lives on the site's receipts tab). */
export const receiptRowSchema = z.object({
  id: z.number(),
  site_id: z.number(),
  site_name: z.string().nullable().optional(),
  status: z.enum(ReceiptRowStatus),
  store_name: z.string().nullable(),
  store_tin: z.string().nullable(),
  receipt_number: z.string().nullable(),
  total_amount: z.string().nullable(),
  note: z.string().nullable(),
  items_count: z.number().optional(),
  photo_url: z.string().nullable(),
  copy_url: z.string(),
  issued_at: z.string().nullable(),
  created_at: z.string(),
})

export type ReceiptRow = z.infer<typeof receiptRowSchema>

export interface ReceiptsParams {
  page?: number
  search?: string
}
