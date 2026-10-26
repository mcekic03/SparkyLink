import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { FINANCE_ROLES } from '#/types/user'
import { PriceListPage } from '#/features/price-list/pages/price-list.page'

const priceListSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/cenovnik')({
  validateSearch: priceListSearchSchema,
  component: PriceListPage,
  staticData: { roles: FINANCE_ROLES },
})
