/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@app/ui/components/checkbox'
import { Button } from '@app/ui/components/button'
import { DataTable } from './data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { ParsedFilterState } from './types'

interface RowData {
  id: number
  name: string
}

const rows: RowData[] = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
]

const columns: ColumnDef<RowData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  { accessorKey: 'name', header: 'Name' },
]

const filterState: ParsedFilterState = {
  search: '',
  page: 1,
  filters: {},
  multiSelect: {},
}

function renderTable(
  overrides: Partial<Parameters<typeof DataTable<RowData>>[0]> = {},
) {
  return render(
    <DataTable
      columns={columns}
      data={rows}
      config={{
        enableRowSelection: true,
        enableColumnVisibility: false,
        getRowId: (row) => String(row.id),
      }}
      filterState={filterState}
      onSearchChange={() => undefined}
      onClearAllFilters={() => undefined}
      hasActiveFilters={false}
      {...overrides}
    />,
  )
}

describe('DataTable actions', () => {
  it('shows actions for selected rows and can clear the selection', async () => {
    const handleRows = vi.fn()
    renderTable({
      renderBulkActions: ({ selectedRows }) => (
        <Button onClick={() => handleRows(selectedRows)}>Use selected</Button>
      ),
    })

    expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).toBeNull()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Ada' }))

    expect(
      await screen.findByRole('toolbar', { name: 'Bulk actions' }),
    ).toBeVisible()
    expect(screen.getByText('1 of 2 selected')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Use selected' }))
    expect(handleRows).toHaveBeenCalledWith([rows[0]])

    await userEvent.click(
      screen.getByRole('button', { name: 'Clear selection' }),
    )
    await waitFor(() => {
      expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).toBeNull()
    })
  })

  it('invokes the full-result export action from the toolbar', async () => {
    const onExport = vi.fn()
    renderTable({
      config: {
        enableRowSelection: true,
        enableColumnVisibility: false,
        getRowId: (row) => String(row.id),
        exports: {
          csv: { enabled: true },
          excel: { enabled: true },
          pdf: { enabled: true },
        },
      },
      onExport,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    await userEvent.click(screen.getByRole('button', { name: 'Export Excel' }))
    await userEvent.click(screen.getByRole('button', { name: 'Export PDF' }))

    expect(onExport.mock.calls).toEqual([['csv'], ['excel'], ['pdf']])
  })
})

// The two copies carry the same controls, so every query has to be scoped to
// one of them or it matches twice.
function paginations() {
  return {
    top: within(
      screen.getByRole('navigation', { name: 'Pagination, above the table' }),
    ),
    bottom: within(
      screen.getByRole('navigation', { name: 'Pagination, below the table' }),
    ),
  }
}

describe('DataTable pagination', () => {
  const serverProps = {
    config: {
      enableRowSelection: false,
      enableColumnVisibility: false,
      manualPagination: true,
      getRowId: (row: RowData) => String(row.id),
    },
    pageCount: 6,
    totalRows: 57,
    pageSize: 10,
  }

  it('renders above and below the table, both showing the same range', () => {
    renderTable({
      ...serverProps,
      filterState: { ...filterState, page: 2 },
      onPageChange: () => undefined,
    })

    const { top, bottom } = paginations()
    expect(top.getByText('11–20 of 57')).toBeVisible()
    expect(bottom.getByText('11–20 of 57')).toBeVisible()
  })

  it('marks the current page and pages from either copy', async () => {
    const onPageChange = vi.fn()
    renderTable({
      ...serverProps,
      filterState: { ...filterState, page: 2 },
      onPageChange,
    })

    const { top, bottom } = paginations()
    expect(top.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(top.getByRole('button', { name: 'Go to page 4' }))
    await userEvent.click(bottom.getByRole('button', { name: 'Next page' }))
    await userEvent.click(bottom.getByRole('button', { name: 'Last page' }))

    expect(onPageChange.mock.calls).toEqual([[4], [3], [6]])
  })

  it('disables the backwards controls on the first page', () => {
    renderTable({ ...serverProps, onPageChange: () => undefined })

    const { top } = paginations()
    expect(top.getByRole('button', { name: 'First page' })).toBeDisabled()
    expect(top.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(top.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  // The rows-selected line moved into the selection toolbar, so the area below
  // the table carries pagination and nothing else.
  it('does not repeat the row count below the table', () => {
    renderTable({ ...serverProps, onPageChange: () => undefined })

    expect(screen.queryByText(/row\(s\)/)).toBeNull()
  })

  it('hides pagination entirely when there are no rows', () => {
    renderTable({ ...serverProps, data: [], totalRows: 0, pageCount: 0 })

    expect(screen.queryByRole('navigation')).toBeNull()
  })
})

describe('DataTable pinned columns', () => {
  it('sticks the configured column to the right edge', () => {
    renderTable({
      columns: [
        ...columns,
        { id: 'actions', header: 'Actions', cell: () => 'E' },
      ],
      config: {
        enableRowSelection: false,
        enableColumnVisibility: false,
        pinnedRightColumns: ['actions'],
        getRowId: (row) => String(row.id),
      },
    })

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toHaveClass(
      'sticky',
    )
    // Every body cell in that column, not just the header — a pinned header
    // over unpinned cells looks right until the table is actually scrolled.
    const actionCells = screen
      .getAllByRole('cell')
      .filter((cell) => cell.textContent === 'E')
    expect(actionCells).toHaveLength(rows.length)
    for (const cell of actionCells) {
      expect(cell).toHaveClass('sticky')
    }
  })

  it('applies a column meta className to the header and every cell', () => {
    renderTable({
      columns: [
        ...columns,
        {
          id: 'actions',
          header: 'Actions',
          cell: () => 'E',
          meta: { className: 'w-px text-right' },
        },
      ],
      config: {
        enableRowSelection: false,
        enableColumnVisibility: false,
        getRowId: (row) => String(row.id),
      },
    })

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toHaveClass(
      'w-px',
      'text-right',
    )
    const cells = screen
      .getAllByRole('cell')
      .filter((cell) => cell.textContent === 'E')
    expect(cells).toHaveLength(rows.length)
    for (const cell of cells) {
      expect(cell).toHaveClass('w-px', 'text-right')
    }
  })

  it('leaves cells alone when nothing is pinned', () => {
    renderTable()

    for (const cell of screen.getAllByRole('cell')) {
      expect(cell).not.toHaveClass('sticky')
    }
  })
})
