import { describe, expect, it } from 'vitest'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { requiredRolesFor } from './route-guard'
import { UserRole } from '#/types/user'

/**
 * Verifies the assumption central enforcement rests on: that a layout route's
 * `beforeLoad` can see the staticData of the child routes matched below it.
 *
 * If it could not, `_authed` would silently enforce nothing — which is the
 * failure mode worth a real router rather than a stub.
 */
describe('matches visible to a parent beforeLoad', () => {
  it('includes child routes and their staticData', async () => {
    const seen: Array<ReadonlyArray<ReadonlyArray<UserRole>>> = []

    const rootRoute = createRootRoute({ component: Outlet })

    const layoutRoute = createRoute({
      getParentRoute: () => rootRoute,
      id: 'layout',
      beforeLoad: ({ matches }) => {
        seen.push(requiredRolesFor(matches))
      },
      component: Outlet,
    })

    const childRoute = createRoute({
      getParentRoute: () => layoutRoute,
      path: '/admin',
      staticData: { roles: [UserRole.SuperAdmin] },
      component: () => null,
    })

    // Memory history rather than navigate(): `to` is typed against the app's
    // own route tree, which this isolated router is not part of.
    const router = createRouter({
      routeTree: rootRoute.addChildren([layoutRoute.addChildren([childRoute])]),
      history: createMemoryHistory({ initialEntries: ['/admin'] }),
    })

    await router.load()

    expect(seen.length).toBeGreaterThan(0)
    expect(seen.at(-1)).toEqual([[UserRole.SuperAdmin]])
  })
})
