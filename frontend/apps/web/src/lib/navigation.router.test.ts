import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '#/routeTree.gen'
import { NAVIGATION, visibleNavigation } from './navigation'
import { canAccessPath } from './route-guard'
import { UserRole } from '#/types/user'
import type { NavPath } from './navigation'

/** The real route tree, not a stub — drift from enforcement is the whole risk. */
function appRouter() {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
  })
}

function visibleTo(role: UserRole | null): NavPath[] {
  const router = appRouter()
  return visibleNavigation(NAVIGATION, (to) =>
    canAccessPath(router, role, to),
  ).flatMap((group) => group.items.map((item) => item.to))
}

describe('navigation against the real route tree', () => {
  it('resolves every registry path to a route', () => {
    const router = appRouter()

    for (const group of NAVIGATION) {
      for (const item of group.items) {
        const matches = router.matchRoutes(item.to)
        expect(matches.map((match) => match.routeId)).toContain('/_authed')
      }
    }
  })

  it('shows the owner every destination', () => {
    expect(visibleTo(UserRole.SuperAdmin)).toEqual([
      '/dashboard',
      '/gradilista',
      '/racuni',
      '/cenovnik',
      '/podesavanja',
    ])
  })

  it('shows nothing when signed out', () => {
    expect(visibleTo(null)).toEqual([])
  })
})
