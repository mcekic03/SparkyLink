/**
 * @vitest-environment happy-dom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  DataTableFilterButton,
  DataTableFilterFields,
} from './data-table-filter-builder'
import type { FilterBuilderConfig } from './types'

const config: FilterBuilderConfig[] = [
  {
    id: 'role',
    label: 'Role',
    type: 'select',
    key: 'role_id',
    options: [
      { label: 'Admin', value: '2' },
      { label: 'User', value: '3' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    key: 'status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    id: 'created',
    label: 'Created',
    type: 'date',
    operators: [
      { key: 'created_from', label: 'Is after' },
      { key: 'created_to', label: 'Is before' },
    ],
  },
]
const EMPTY_FILTERS: Record<string, string> = {}
const DEFAULT_SET_FILTER = vi.fn()

function FilterBuilderHarness({
  filters = EMPTY_FILTERS,
  setFilter = DEFAULT_SET_FILTER,
}: {
  filters?: Record<string, string>
  setFilter?: (key: string, value: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <DataTableFilterButton
        config={config}
        filters={filters}
        open={open}
        contentId="test-filter-fields"
        onOpenChange={setOpen}
      />
      <DataTableFilterFields
        config={config}
        filters={filters}
        setFilter={setFilter}
        open={open}
        id="test-filter-fields"
      />
    </div>
  )
}

describe('DataTableFilterBuilder', () => {
  it('shows and hides all configured filter fields', async () => {
    render(<FilterBuilderHarness />)

    const trigger = screen.getByRole('button', { name: 'Filter' })
    const panel = document.querySelector('[data-slot="filter-fields"]')
    expect(panel).toHaveAttribute('aria-hidden', 'true')

    await userEvent.click(trigger)
    expect(panel).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByLabelText('Role')).toBeVisible()
    expect(screen.getByLabelText('Status')).toBeVisible()
    expect(screen.getAllByRole('button', { name: 'Pick a date' })).toHaveLength(
      2,
    )

    await userEvent.click(trigger)
    expect(panel).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the number of active filter values', () => {
    render(
      <FilterBuilderHarness
        filters={{ status: 'active', created_from: '2025-01-20' }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Filter 2' })).toBeVisible()
  })

  it('applies a date chosen from the calendar', async () => {
    const setFilter = vi.fn()
    render(<FilterBuilderHarness setFilter={setFilter} />)

    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    // getAllByRole throws when nothing matches, so the first entry is safe.
    const [from] = screen.getAllByRole('button', { name: 'Pick a date' })
    await userEvent.click(from)

    // The calendar opens on the current month; any day in it will do, and the
    // assertion is on the shape of what it hands back rather than on a date
    // that would go stale. Day buttons are named "Sunday, July 26th, 2026" —
    // the month-navigation buttons are the ones without a year.
    const dialog = await screen.findByRole('dialog')
    const [day] = within(dialog).getAllByRole('button', { name: /\d{4}$/ })
    await userEvent.click(day)

    expect(setFilter).toHaveBeenCalledOnce()
    const [key, value] = setFilter.mock.calls[0] ?? []
    expect(key).toBe('created_from')
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
