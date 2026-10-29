/**
 * @vitest-environment happy-dom
 */
import { afterAll, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Outlet,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { renderRouter } from '#/test/router'
import { CommandPalette } from './command-palette'
import { AuthProvider } from '#/lib/auth-context'
import { authStore } from '#/lib/auth-store'
import { UserRole } from '#/types/user'
import type { User } from '#/types/user'

const ADMIN: User = {
  id: 1,
  role_id: UserRole.SuperAdmin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2024-01-01',
}


/**
 * A stand-in tree — the app's root pulls in devtools and a full layout. That
 * the real routes carry these roles is `navigation.router.test.ts`'s job.
 */
function renderPalette(user: User) {
  authStore.logout()
  authStore.login(user, 'token')

  const rootRoute = createRootRoute({
    component: () => (
      <AuthProvider>
        <CommandPalette />
        <Outlet />
      </AuthProvider>
    ),
  })
  const index = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <p>home</p>,
  })
  const dashboard = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: () => null,
  })
  const settings = createRoute({
    getParentRoute: () => rootRoute,
    path: '/podesavanja',
    staticData: { roles: [UserRole.SuperAdmin] },
    component: () => null,
  })
  // Prazan spisak uloga ne pušta nikoga, pa ova stranica ne sme da se ponudi.
  const priceList = createRoute({
    getParentRoute: () => rootRoute,
    path: '/cenovnik',
    staticData: { roles: [] },
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([index, dashboard, settings, priceList]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  renderRouter(router)

  // Asserting before the router settles leaves updates outside act().
  return screen.findByText('home')
}

// afterAll, not afterEach — those run in reverse order, so it would fire before
// the DOM unmounts and update a still-mounted AuthProvider outside act().
afterAll(() => authStore.logout())

describe('command palette', () => {
  it('stays closed until the shortcut is pressed', async () => {
    await renderPalette(ADMIN)

    expect(screen.queryByPlaceholderText('Type to search...')).toBeNull()
  })

  it('opens on ctrl+k and lists what the role may reach', async () => {
    await renderPalette(ADMIN)

    await userEvent.keyboard('{Control>}k{/Control}')

    expect(
      await screen.findByPlaceholderText('Type to search...'),
    ).toBeVisible()
    expect(screen.getByRole('option', { name: /Overview/ })).toBeVisible()
    expect(screen.getByRole('option', { name: /Settings/ })).toBeVisible()
  })

  it('omits destinations the role would be bounced from', async () => {
    await renderPalette(ADMIN)

    await userEvent.keyboard('{Control>}k{/Control}')

    expect(
      await screen.findByRole('option', { name: /Overview/ }),
    ).toBeVisible()
    expect(screen.queryByRole('option', { name: /Price list/ })).toBeNull()
  })

  it('ignores k without a modifier, which is just typing', async () => {
    await renderPalette(ADMIN)

    await userEvent.keyboard('k')

    expect(screen.queryByPlaceholderText('Type to search...')).toBeNull()
  })

  it('closes again on a second press', async () => {
    await renderPalette(ADMIN)
    await userEvent.keyboard('{Control>}k{/Control}')
    await screen.findByPlaceholderText('Type to search...')

    await userEvent.keyboard('{Control>}k{/Control}')

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Type to search...')).toBeNull()
    })
  })
})
