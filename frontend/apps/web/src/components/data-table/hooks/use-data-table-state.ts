import { useState, useMemo } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { DataTableConfig, ParsedFilterState } from '../types'

const DEFAULT_PAGE_SIZE = 10

export function useDataTableState<TData>({
  data,
  columns,
  config,
  filterState,
  pageCount,
  pageSize,
}: {
  data: TData[]
  columns: ColumnDef<TData>[]
  config: DataTableConfig<TData>
  filterState: ParsedFilterState
  pageCount?: number
  pageSize?: number
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columnFilters: ColumnFiltersState = useMemo(() => {
    if (config.manualFiltering) return []

    const filters: ColumnFiltersState = []

    if (config.searchColumn && filterState.search) {
      filters.push({ id: config.searchColumn, value: filterState.search })
    }

    for (const [columnId, values] of Object.entries(filterState.multiSelect)) {
      if (values.length > 0) {
        filters.push({ id: columnId, value: values })
      }
    }

    return filters
  }, [config.searchColumn, config.manualFiltering, filterState])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      // Declared by the table config and never changed at runtime, so it is
      // passed as state rather than wired to a setter.
      columnPinning: { left: [], right: config.pinnedRightColumns ?? [] },
      rowSelection,
      ...(config.manualPagination && {
        pagination: {
          pageIndex: filterState.page - 1,
          pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
        },
      }),
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: config.enableRowSelection
      ? setRowSelection
      : undefined,
    enableRowSelection: config.enableRowSelection ?? false,
    getRowId: config.getRowId,
    manualPagination: config.manualPagination,
    manualFiltering: config.manualFiltering,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(!config.manualFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
    }),
    ...(!config.manualPagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
  })

  return table
}
