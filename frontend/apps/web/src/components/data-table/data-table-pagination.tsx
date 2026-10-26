import type { Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { getPageItems, getRowRange } from './pagination-items'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  /** Distinguishes the copy above the table from the one below it. */
  label: string
  currentPage?: number
  totalRows?: number
  onPageChange?: (page: number) => void
}

export function DataTablePagination<TData>({
  table,
  label,
  currentPage,
  totalRows,
  onPageChange,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const isServerSide = onPageChange !== undefined && currentPage !== undefined
  const pageCount = Math.max(table.getPageCount(), 1)
  const page = Math.min(
    isServerSide ? currentPage : table.getState().pagination.pageIndex + 1,
    pageCount,
  )
  const canPrev = page > 1
  const canNext = page < pageCount

  const total = totalRows ?? table.getFilteredRowModel().rows.length
  const { from, to } = getRowRange(
    page,
    table.getState().pagination.pageSize,
    total,
  )

  const goTo = (next: number) =>
    isServerSide ? onPageChange(next) : table.setPageIndex(next - 1)

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2"
    >
      <span className="text-sm text-muted-foreground tabular-nums">
        {t('table.pageRange', { from, to, total })}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(1)}
          disabled={!canPrev}
          aria-label={t('table.firstPage')}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(page - 1)}
          disabled={!canPrev}
          aria-label={t('table.previous')}
        >
          <ChevronLeft />
        </Button>
        {getPageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <Button
              key={item}
              variant={item === page ? 'default' : 'outline'}
              size="icon-sm"
              className="tabular-nums"
              aria-label={t('table.goToPage', { page: item })}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => goTo(item)}
            >
              {item}
            </Button>
          ) : (
            <span
              key={item}
              aria-hidden
              className="px-1 text-sm text-muted-foreground"
            >
              &hellip;
            </span>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(page + 1)}
          disabled={!canNext}
          aria-label={t('table.next')}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goTo(pageCount)}
          disabled={!canNext}
          aria-label={t('table.lastPage')}
        >
          <ChevronsRight />
        </Button>
      </div>
    </nav>
  )
}
