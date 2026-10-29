import { createFileRoute, redirect } from '@tanstack/react-router'
import { authStore } from '#/lib/auth-store'

/** No public site: the start page sends the owner to the overview. */
export const Route = createFileRoute('/_unauthed/')({
  beforeLoad: () => {
    if (!authStore.getSnapshot().isAuthenticated) throw redirect({ to: '/sign-in' })

    throw redirect({ to: '/dashboard' })
  },
})
