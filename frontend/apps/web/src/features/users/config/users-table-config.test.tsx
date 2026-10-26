/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { TooltipProvider } from '@app/ui/components/tooltip'
import { DataTable } from '#/components/data-table'
import { renderRouter } from '#/test/router'
import { usersColumns, usersTableConfig } from './users-table-config'
import { UserRole } from '../types'
import type { User } from '../types'

const users: User[] = [
  {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role_id: UserRole.Admin,
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    id: 2,
    name: 'Grace Hopper',
    email: 'grace@example.com',
    role_id: UserRole.Admin,
    created_at: '2026-02-05T10:00:00Z',
  },
]

/**
 * The rows link to the edit route, so the table needs a router around it — and
 * a tooltip provider, which the app mounts at the root.
 */
function renderUsersTable(onDelete: (user: User) => void) {
  function Harness() {
    const { t } = useTranslation()
    return (
      <TooltipProvider>
        <DataTable
          columns={usersColumns(t, { onDelete })}
          data={users}
          config={usersTableConfig(t)}
          filterState={{ search: '', page: 1, filters: {}, multiSelect: {} }}
          onSearchChange={() => undefined}
          onSetFilter={() => undefined}
          onClearAllFilters={() => undefined}
          hasActiveFilters={false}
          pageCount={1}
          totalRows={users.length}
          pageSize={10}
          onPageChange={() => undefined}
        />
      </TooltipProvider>
    )
  }

  const rootRoute = createRootRoute({ component: Harness })
  return renderRouter(
    createRouter({
      routeTree: rootRoute.addChildren([
        createRoute({ getParentRoute: () => rootRoute, path: '/' }),
        createRoute({
          getParentRoute: () => rootRoute,
          path: '/users/$userId',
        }),
      ]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    }),
  )
}

describe('users table actions', () => {
  it('asks to delete the row whose button was pressed, after confirming', async () => {
    const onDelete = vi.fn()
    renderUsersTable(onDelete)

    // Every row carries the same button, so the second one is what proves the
    // handler is bound per row rather than to a captured first row.
    const buttons = await screen.findAllByRole('button', {
      name: 'Delete user',
    })
    expect(buttons).toHaveLength(users.length)
    await userEvent.click(buttons[1])

    // The first click only opens the bubble: nothing is deleted by pressing a
    // trash icon once.
    expect(onDelete).not.toHaveBeenCalled()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Are you sure?' }),
    )
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(users[1])
  })

  it('does not delete anything by merely rendering', async () => {
    const onDelete = vi.fn()
    renderUsersTable(onDelete)

    await screen.findAllByRole('button', { name: 'Delete user' })
    expect(onDelete).not.toHaveBeenCalled()
  })
})
