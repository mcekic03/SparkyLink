import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import type { Table } from '@tanstack/react-table'
import { Download, Settings2, X } from 'lucide-react'
import { Input } from '@app/ui/components/input'
import { Button } from '@app/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/components/dropdown-menu'
import { cn } from '@app/ui/lib/utils'
import { TOOLBAR_BUTTON_HOVER, TOOLBAR_FIELD_HOVER } from './control-styles'
import type { DataTableExportFormat } from './types'

interface ExportAction {
  format: DataTableExportFormat
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterBuilder?: ReactNode
  filterBuilderContent?: ReactNode
  filterContent?: ReactNode
  enableColumnVisibility?: boolean
  hasActiveFilters: boolean
  onClearAllFilters: () => void
  exportActions: readonly ExportAction[]
  onExport?: (format: DataTableExportFormat) => void
}

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterBuilder,
  filterBuilderContent,
  filterContent,
  enableColumnVisibility = true,
  hasActiveFilters,
  onClearAllFilters,
  exportActions,
  onExport,
}: DataTableToolbarProps<TData>) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-2 px-2 py-2.5">
        <Input
          placeholder={searchPlaceholder ?? t('common.search')}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'h-8 w-full max-w-sm bg-background',
            TOOLBAR_FIELD_HOVER,
          )}
        />
        {filterBuilder}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={onClearAllFilters}
          >
            {t('table.clearFilters')}
            <X className="ml-1 size-4" />
          </Button>
        )}
        {onExport &&
          exportActions.map((action, index) => (
            <Button
              key={action.format}
              variant="outline"
              size="sm"
              className={cn(
                TOOLBAR_BUTTON_HOVER,
                index === 0 ? 'ml-auto h-8' : 'h-8',
              )}
              onClick={() => onExport(action.format)}
            >
              <Download className="mr-1 size-4" />
              {t(`table.export.${action.format}`)}
            </Button>
          ))}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  TOOLBAR_BUTTON_HOVER,
                  exportActions.length > 0 ? 'h-8' : 'ml-auto h-8',
                )}
              >
                <Settings2 className="mr-2 size-4" />
                <span className="hidden sm:inline">{t('table.columns')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('table.toggleColumns')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {filterBuilderContent}
      {filterContent && <div className="border-t p-2">{filterContent}</div>}
    </div>
  )
}
