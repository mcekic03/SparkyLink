import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { SitesPage } from '#/features/sites/pages/sites.page'

/** Every field `.catch`es to undefined so a stale or hand-typed URL degrades to defaults. */
const sitesSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
  payment_status: z.string().optional().catch(undefined),
  trashed: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/gradilista/')({
  validateSearch: sitesSearchSchema,
  component: SitesPage,
})
