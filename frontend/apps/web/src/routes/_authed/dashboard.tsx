import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { FINANCE_ROLES } from '#/types/user'
import { DashboardPage } from '#/features/dashboard/pages/dashboard.page'

const dashboardSearchSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/dashboard')({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
  staticData: { roles: FINANCE_ROLES },
})
