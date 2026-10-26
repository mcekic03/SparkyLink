/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Outlet,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TestLink, renderRouter } from '#/test/router'
import { useFocusOnNavigate } from './use-focus-on-navigate'

function Layout() {
  const ref = useFocusOnNavigate<HTMLElement>()
  return (
    <main ref={ref} tabIndex={-1} data-testid="content">
      <TestLink to="/second">go</TestLink>
      <Outlet />
    </main>
  )
}

function renderApp() {
  const rootRoute = createRootRoute({ component: Layout })
  const first = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <h1>first</h1>,
  })
  const second = createRoute({
    getParentRoute: () => rootRoute,
    path: '/second',
    component: () => <h1>second</h1>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([first, second]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return renderRouter(router)
}

describe('useFocusOnNavigate', () => {
  it('leaves focus alone on the first render', async () => {
    renderApp()
    await screen.findByText('first')

    expect(screen.getByTestId('content')).not.toHaveFocus()
  })

  it('moves focus to the container after navigating', async () => {
    renderApp()

    await userEvent.click(await screen.findByRole('link', { name: 'go' }))

    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveFocus()
    })
  })
})
