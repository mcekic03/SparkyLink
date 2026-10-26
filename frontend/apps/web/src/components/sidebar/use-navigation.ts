import { useMemo } from 'react'
import { useRouter } from '@tanstack/react-router'
import { NAVIGATION, visibleNavigation } from '#/lib/navigation'
import { canAccessPath } from '#/lib/route-guard'
import { useAuth } from '#/lib/auth-context'
import type { NavGroup } from '#/lib/navigation'

export function useVisibleNavigation(): readonly NavGroup[] {
  const router = useRouter()
  const { user } = useAuth()
  const role = user?.role_id ?? null

  return useMemo(
    () =>
      visibleNavigation(NAVIGATION, (to) => canAccessPath(router, role, to)),
    [router, role],
  )
}
