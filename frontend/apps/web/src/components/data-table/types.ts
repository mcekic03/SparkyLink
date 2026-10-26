import type { ComponentType, ReactNode } from 'react'
import type { RowData } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // The generics are TanStack's; both are required by the interface it merges
  // with, even though neither is referenced here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Classes applied to this column's header cell and every body cell in it.
     * For width and alignment — `w-px` collapses a column to its content, which
     * is how an actions column stays as narrow as the buttons in it.
     */
    className?: string
  }
}

export interface FilterOption {
  label: string
  value: string
  icon?: ComponentType
}

export type FilterConfig = {
  type: 'multi-select'
  columnId: string
  label: string
  options: FilterOption[]
  defaultOpen?: boolean
  mode?: 'single' | 'multi'
}

export interface FilterRenderProps {
  filters: Record<string, string>
  setFilter: (key: string, value: string | undefined) => void
  clearAll: () => void
}

export interface FilterBuilderOption {
  label: string
  value: string
}

export interface SelectFilterBuilderConfig {
  id: string
  label: string
  type: 'select'
  key: string
  options: FilterBuilderOption[]
}

export interface DateFilterBuilderOperator {
  key: string
  label: string
}

export interface DateFilterBuilderConfig {
  id: string
  label: string
  type: 'date'
  operators: DateFilterBuilderOperator[]
}

export type FilterBuilderConfig =
  SelectFilterBuilderConfig | DateFilterBuilderConfig

export type DataTableExportFormat = 'csv' | 'excel' | 'pdf'

export interface DataTableExportOption {
  enabled: boolean
}

export interface DataTableExportConfig {
  csv?: DataTableExportOption
  excel?: DataTableExportOption
  pdf?: DataTableExportOption
}

export interface DataTableConfig<TData> {
  filters?: FilterConfig[]
  renderFilters?: (props: FilterRenderProps) => ReactNode
  filterBuilder?: FilterBuilderConfig[]
  searchColumn?: Extract<keyof TData, string>
  searchPlaceholder?: string
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  manualPagination?: boolean
  manualFiltering?: boolean
  /**
   * Column ids held against the right edge while the rest scrolls under them.
   * Intended for the trailing actions column: once a table is wide enough to
   * scroll, the row's actions are otherwise off-screen exactly when the row
   * you want to act on is visible.
   */
  pinnedRightColumns?: string[]
  getRowId?: (row: TData) => string
  exports?: DataTableExportConfig
}

export interface BulkActionRenderProps<TData> {
  selectedRows: TData[]
  clearSelection: () => void
}

export interface ParsedFilterState {
  search: string
  page: number
  filters: Record<string, string>
  multiSelect: Record<string, string[]>
}
