import { createFileRoute } from '@tanstack/react-router'
import { UserRole } from '#/types/user'
import { SettingsPage } from '#/features/settings/pages/settings.page'

export const Route = createFileRoute('/_authed/podesavanja')({
  component: SettingsPage,
  staticData: { roles: [UserRole.SuperAdmin] },
})
