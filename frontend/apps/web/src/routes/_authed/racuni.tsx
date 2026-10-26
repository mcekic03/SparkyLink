import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { ReceiptsPage } from '#/features/receipts/pages/receipts.page'

const receiptsSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/racuni')({
  validateSearch: receiptsSearchSchema,
  component: ReceiptsPage,
})
