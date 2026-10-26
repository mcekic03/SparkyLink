import { createFileRoute } from '@tanstack/react-router'
import z from 'zod'
import { SITE_TABS } from '#/features/sites/config/site-tabs'
import { SiteDetailPage } from '#/features/sites/pages/site-detail.page'

const siteSearchSchema = z.object({
  tab: z.enum(SITE_TABS).optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/gradilista/$siteId/')({
  validateSearch: siteSearchSchema,
  component: SiteDetailPage,
})
