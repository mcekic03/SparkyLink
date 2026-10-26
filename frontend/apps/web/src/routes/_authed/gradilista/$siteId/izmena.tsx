import { createFileRoute } from '@tanstack/react-router'
import { FINANCE_ROLES } from '#/types/user'
import { SiteFormPage } from '#/features/sites/pages/site-form.page'

function EditSiteRoute() {
  const { siteId } = Route.useParams()
  return <SiteFormPage siteId={Number(siteId)} />
}

export const Route = createFileRoute('/_authed/gradilista/$siteId/izmena')({
  component: EditSiteRoute,
  staticData: { roles: FINANCE_ROLES },
})
