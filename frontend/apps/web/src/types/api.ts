import { z } from 'zod'

// The backend uses snake_case; those names are kept as-is on the wire types.

export const paginationSchema = z.object({
  total: z.number(),
  per_page: z.number(),
  current_page: z.number(),
  total_pages: z.number(),
})

export type Pagination = z.infer<typeof paginationSchema>

export interface PaginatedResponse<T> {
  pagination: Pagination
  data: T[]
}

/** The `response()->success(message)` envelope. */
export const messageResponseSchema = z.object({
  message: z.string(),
})

export type MessageResponse = z.infer<typeof messageResponseSchema>
