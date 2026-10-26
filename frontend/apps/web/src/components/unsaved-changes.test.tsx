/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Outlet,
  createBrowserHistory,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TestLink, renderRouter } from '#/test/router'
import { UnsavedChangesProvider, useUnsavedChanges } from './unsaved-changes'

function DirtyForm({ isDirty }: { isDirty: boolean }) {
  const [dirty, setDirty] = useState(isDirty)
  useUnsavedChanges(dirty)
  return <button onClick={() => setDirty(false)}>save</button>
}

function renderApp(isDirty: boolean) {
  const rootRoute = createRootRoute({
    component: () => (
      <UnsavedChangesProvider>
        <TestLink to="/second">leave</TestLink>
        <Outlet />
      </UnsavedChangesProvider>
    ),
  })
  const first = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <DirtyForm isDirty={isDirty} />,
  })
  const second = createRoute({
    getParentRoute: () => rootRoute,
    path: '/second',
    component: () => <h1>second page</h1>,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([first, second]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  return renderRouter(router)
}

describe('unsaved changes guard', () => {
  it('lets navigation through when nothing is dirty', async () => {
    renderApp(false)

    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    expect(await screen.findByText('second page')).toBeVisible()
  })

  it('blocks navigation and keeps the page when a form is dirty', async () => {
    renderApp(true)

    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    expect(await screen.findByText('Unsaved changes')).toBeVisible()
    expect(screen.queryByText('second page')).toBeNull()
  })

  it('stays put when the prompt is dismissed', async () => {
    renderApp(true)
    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    await userEvent.click(
      await screen.findByRole('button', { name: 'Stay on page' }),
    )

    await waitFor(() => {
      expect(screen.queryByText('Unsaved changes')).toBeNull()
    })
    expect(screen.queryByText('second page')).toBeNull()
  })

  it('navigates once the changes are discarded', async () => {
    renderApp(true)
    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    )

    expect(await screen.findByText('second page')).toBeVisible()
  })

  it('stops blocking once the form is no longer dirty', async () => {
    renderApp(true)
    await userEvent.click(await screen.findByRole('button', { name: 'save' }))

    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    expect(await screen.findByText('second page')).toBeVisible()
  })

  it('keeps blocking while a second form is still dirty', async () => {
    const rootRoute = createRootRoute({
      component: () => (
        <UnsavedChangesProvider>
          <TestLink to="/second">leave</TestLink>
          <DirtyForm isDirty />
          <DirtyForm isDirty />
        </UnsavedChangesProvider>
      ),
    })
    const first = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => null,
    })
    const second = createRoute({
      getParentRoute: () => rootRoute,
      path: '/second',
      component: () => <h1>second page</h1>,
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([first, second]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    renderRouter(router)

    const saves = await screen.findAllByRole('button', { name: 'save' })
    await userEvent.click(saves[0])
    await userEvent.click(await screen.findByRole('link', { name: 'leave' }))

    expect(await screen.findByText('Unsaved changes')).toBeVisible()
  })

  // Osvežavanje ili zatvaranje kartice ne sme da otvori sistemski dijalog
  // pregledača, čak ni sa nesačuvanim izmenama (vidi komentar u komponenti).
  it('never asks the browser to confirm a reload or a closed tab', async () => {
    const rootRoute = createRootRoute({
      component: () => (
        <UnsavedChangesProvider>
          <DirtyForm isDirty />
        </UnsavedChangesProvider>
      ),
    })
    const router = createRouter({
      routeTree: rootRoute,
      history: createBrowserHistory(),
    })
    renderRouter(router)
    await screen.findByRole('button', { name: 'save' })

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('throws when used outside the provider', () => {
    expect(() => render(<DirtyForm isDirty />)).toThrowError(
      /UnsavedChangesProvider/,
    )
  })
})
