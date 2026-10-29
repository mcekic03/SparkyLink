import { createFileRoute } from '@tanstack/react-router'
import { SiteFormPage } from '#/features/sites/pages/site-form.page'

export const Route = createFileRoute('/_authed/gradilista/novo')({
  component: () => <SiteFormPage />,
})
