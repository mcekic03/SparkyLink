import { createFileRoute, redirect } from '@tanstack/react-router'
import { authStore } from '#/lib/auth-store'
import { canViewFinances } from '#/types/user'

/** No public site: the start page sends everyone where their work is. */
export const Route = createFileRoute('/_unauthed/')({
  beforeLoad: () => {
    const { isAuthenticated, user } = authStore.getSnapshot()

    if (!isAuthenticated) throw redirect({ to: '/sign-in' })

    throw redirect({ to: canViewFinances(user) ? '/dashboard' : '/gradilista' })
  },
})
