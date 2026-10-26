import { createFileRoute } from '@tanstack/react-router'
import { FINANCE_ROLES } from '#/types/user'
import { SiteFormPage } from '#/features/sites/pages/site-form.page'

export const Route = createFileRoute('/_authed/gradilista/novo')({
  component: () => <SiteFormPage />,
  staticData: { roles: FINANCE_ROLES },
})
