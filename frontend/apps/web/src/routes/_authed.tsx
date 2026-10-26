import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthedLayout } from '#/layouts/authed-layout'
import { authStore } from '#/lib/auth-store'
import { checkAccess, requiredRolesFor } from '#/lib/route-guard'

export const Route = createFileRoute('/_authed')({
  // Reads the store rather than router context: the store is the source of
  // truth and is current at the moment of navigation, whereas context is a
  // React render behind.
  beforeLoad: ({ location, matches }) => {
    const { isAuthenticated, user } = authStore.getSnapshot()
    const role = isAuthenticated && user !== null ? user.role_id : null

    switch (checkAccess(role, requiredRolesFor(matches))) {
      case 'unauthenticated':
        throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      case 'forbidden':
        throw redirect({ to: '/forbidden' })
      case 'allowed':
        break
    }
  },
  component: AuthedLayout,
})
