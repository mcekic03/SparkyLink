import { useTranslation } from 'react-i18next'
import { useId, useState } from 'react'
import { SearchXIcon, XIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { cn } from '@app/ui/lib/utils'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@app/ui/components/empty'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/ui/components/table'
import { Skeleton } from '@app/ui/components/skeleton'
import type {
  BulkActionRenderProps,
  DataTableConfig,
  DataTableExportFormat,
  FilterRenderProps,
  ParsedFilterState,
} from './types'
import { useDataTableState } from './hooks/use-data-table-state'
import { DataTableFilterSidebar } from './data-table-filter-sidebar'
import {
  DataTableFilterButton,
  DataTableFilterFields,
} from './data-table-filter-builder'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTablePagination } from './data-table-pagination'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  config: DataTableConfig<TData>
  filterState: ParsedFilterState
  onSearchChange: (value: string) => void
  onToggleFilterValue?: (columnId: string, value: string) => void
  onSetFilter?: (key: string, value: string | undefined) => void
  onClearAllFilters: () => void
  hasActiveFilters: boolean
  pageCount?: number
  totalRows?: number
  /** Server page size (`pagination.per_page`). Falls back to the client default. */
  pageSize?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  onExport?: (format: DataTableExportFormat) => void
  renderBulkActions?: (props: BulkActionRenderProps<TData>) => ReactNode
}

const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => `row-${i}`)

// A pinned cell sits over rows scrolling beneath it, so its background has to be
// opaque. The row's own hover and selected tints are translucent over the card,
// so they are re-mixed against it here rather than reused directly — reusing
// them lets the scrolled content show through.
const PINNED_CELL =
  'sticky z-10 border-l bg-card ' +
  'group-hover/row:bg-[color-mix(in_oklch,var(--muted)_60%,var(--card))] ' +
  'group-data-[state=selected]/row:bg-[color-mix(in_oklch,var(--primary)_5%,var(--card))]'

export function DataTable<TData>({
  columns,
  data,
  config,
  filterState,
  onSearchChange,
  onToggleFilterValue,
  onSetFilter,
  onClearAllFilters,
  hasActiveFilters,
  pageCount,
  totalRows,
  pageSize,
  onPageChange,
  isLoading,
  onExport,
  renderBulkActions,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const filterPanelId = useId()
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const table = useDataTableState({
    data,
    columns,
    config,
    filterState,
    pageCount,
    pageSize,
  })

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  // Server-driven tables know the total from the response; client-side ones
  // only ever hold the rows they were handed.
  const rowCount = totalRows ?? table.getFilteredRowModel().rows.length
  const exportActions = (
    [
      ['csv', config.exports?.csv],
      ['excel', config.exports?.excel],
      ['pdf', config.exports?.pdf],
    ] as const
  )
    .filter((entry) => entry[1]?.enabled)
    .map(([format]) => ({ format }))

  // Bound to locals so TypeScript narrows them below, rather than losing the
  // narrowing across a boolean and needing non-null assertions.
  const { filterBuilder, renderFilters, filters: autoFilters } = config
  const hasAutoFilters = (autoFilters?.length ?? 0) > 0
  const filterRenderProps: FilterRenderProps | undefined = onSetFilter
    ? {
        filters: filterState.filters,
        setFilter: onSetFilter,
        clearAll: onClearAllFilters,
      }
    : undefined

  const filterContent =
    renderFilters && filterRenderProps ? (
      renderFilters(filterRenderProps)
    ) : autoFilters && hasAutoFilters && onToggleFilterValue ? (
      <DataTableFilterSidebar
        filters={autoFilters}
        filterState={filterState}
        onToggleFilterValue={onToggleFilterValue}
      />
    ) : null
  const hasFilterBuilder = Boolean(
    filterBuilder && filterBuilder.length > 0 && onSetFilter,
  )
  const filterBuilderTrigger =
    hasFilterBuilder && filterBuilder ? (
      <DataTableFilterButton
        config={filterBuilder}
        filters={filterState.filters}
        open={filterPanelOpen}
        contentId={filterPanelId}
        onOpenChange={setFilterPanelOpen}
      />
    ) : null
  const filterBuilderContent =
    hasFilterBuilder && filterBuilder && onSetFilter ? (
      <DataTableFilterFields
        config={filterBuilder}
        filters={filterState.filters}
        setFilter={onSetFilter}
        open={filterPanelOpen}
        id={filterPanelId}
      />
    ) : null

  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden">
      <div className="relative">
        <div inert={selectedRows.length > 0 ? true : undefined}>
          <DataTableToolbar
            table={table}
            searchValue={filterState.search}
            onSearchChange={onSearchChange}
            searchPlaceholder={config.searchPlaceholder}
            filterBuilder={filterBuilderTrigger}
            filterBuilderContent={filterBuilderContent}
            filterContent={filterContent}
            enableColumnVisibility={config.enableColumnVisibility}
            hasActiveFilters={hasActiveFilters}
            onClearAllFilters={onClearAllFilters}
            exportActions={exportActions}
            onExport={onExport}
          />
        </div>
        {config.enableRowSelection && selectedRows.length > 0 && (
          <div
            role="toolbar"
            aria-label={t('table.bulkActions')}
            className={`absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 border bg-muted px-3 py-2.5 ${Object.keys(filterState.filters).length > 0 ? 'rounded-t-lg' : 'rounded-lg'}`}
          >
            <span className="mr-auto text-sm font-medium tabular-nums">
              {t('table.selectionCount', {
                selected: selectedRows.length,
                total: rowCount,
              })}
            </span>
            {renderBulkActions?.({
              selectedRows,
              clearSelection: () => table.resetRowSelection(),
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => table.resetRowSelection()}
            >
              <XIcon className="mr-1 size-4" />
              {t('table.clearSelection')}
            </Button>
          </div>
        )}
      </div>
      {rowCount > 0 && (
        <DataTablePagination
          table={table}
          label={t('table.paginationTop')}
          currentPage={onPageChange ? filterState.page : undefined}
          totalRows={totalRows}
          onPageChange={onPageChange}
        />
      )}
      {isLoading ? (
        <div className="space-y-3">
          {SKELETON_ROWS.map((id) => (
            <Skeleton key={id} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      // z above the body's pinned cells, which scroll under it.
                      className={cn(
                        header.column.columnDef.meta?.className,
                        header.column.getIsPinned() === 'right' &&
                          'sticky z-20 border-l bg-card',
                      )}
                      style={{
                        right:
                          header.column.getIsPinned() === 'right'
                            ? header.column.getAfter('right')
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="group/row"
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.getIsPinned() === 'right' && PINNED_CELL,
                        )}
                        style={{
                          right:
                            cell.column.getIsPinned() === 'right'
                              ? cell.column.getAfter('right')
                              : undefined,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SearchXIcon />
                        </EmptyMedia>
                        <EmptyTitle>{t('table.empty.title')}</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters
                            ? t('table.empty.filtered')
                            : t('table.empty.description')}
                        </EmptyDescription>
                      </EmptyHeader>
                      {hasActiveFilters && (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearAllFilters}
                          >
                            {t('table.clearFilters')}
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {rowCount > 0 && (
        <DataTablePagination
          table={table}
          label={t('table.paginationBottom')}
          currentPage={onPageChange ? filterState.page : undefined}
          totalRows={totalRows}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
