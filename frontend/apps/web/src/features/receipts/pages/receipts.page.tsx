import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, getRouteApi } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PrinterIcon } from 'lucide-react'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import { DataTable, useDataTableFilters } from '#/components/data-table'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { formatDateTime } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount } from '#/lib/money'
import { adminKeys } from '#/lib/query-keys'
import { Currency } from '#/types/money'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { DataTableConfig } from '#/components/data-table'
import { fetchReceipts } from '../api/receipts.api'
import type { ReceiptRow, ReceiptsParams } from '../types'

const routeApi = getRouteApi('/_authed/racuni')

function tableConfig(t: TFunction): DataTableConfig<ReceiptRow> {
  return {
    searchColumn: 'store_name',
    searchPlaceholder: t('receipts.searchPlaceholder'),
    manualPagination: true,
    manualFiltering: true,
    pinnedRightColumns: ['actions'],
    getRowId: (row) => String(row.id),
  }
}

function columns(t: TFunction): ColumnDef<ReceiptRow>[] {
  return [
    {
      id: 'store',
      header: () => t('receipts.columns.store'),
      cell: ({ row }) => (
        <span className="block min-w-40">
          <span className="font-medium">{row.original.store_name ?? t('receipts.photo')}</span>
          {row.original.receipt_number && <span className="block text-xs text-muted-foreground">{row.original.receipt_number}</span>}
          {row.original.note && <span className="block text-xs text-muted-foreground">{row.original.note}</span>}
        </span>
      ),
    },
    {
      id: 'date',
      header: () => t('receipts.columns.date'),
      cell: ({ row }) => formatDateTime(row.original.issued_at ?? row.original.created_at),
    },
    {
      id: 'site',
      header: () => t('receipts.columns.site'),
      cell: ({ row }) => (
        <Link
          to="/gradilista/$siteId"
          params={{ siteId: String(row.original.site_id) }}
          search={{ tab: 'receipts' }}
          className="hover:underline"
        >
          {row.original.site_name ?? `#${String(row.original.site_id)}`}
        </Link>
      ),
    },
    {
      id: 'total',
      header: () => t('receipts.columns.total'),
      meta: { className: 'text-right' },
      cell: ({ row }) => (row.original.total_amount ? formatAmount(row.original.total_amount, Currency.RSD) : ''),
    },
    {
      id: 'status',
      header: () => t('receipts.columns.status'),
      cell: ({ row }) => <Badge variant="outline">{t(`receipts.status.${row.original.status}`)}</Badge>,
    },
    {
      id: 'actions',
      meta: { className: 'w-px text-right' },
      header: () => <span className="sr-only">{t('table.actions')}</span>,
      cell: ({ row }) => (
        <Button asChild variant="outline" size="sm">
          <a href={row.original.copy_url} target="_blank" rel="noreferrer">
            <PrinterIcon /> <span className="hidden sm:inline">{t('receipts.copy')}</span>
          </a>
        </Button>
      ),
    },
  ]
}

export function ReceiptsPage() {
  const { t } = useTranslation()
  const search = routeApi.useSearch()
  const { filterState, setSearch, setPage, setFilter, clearAllFilters, hasActiveFilters } = useDataTableFilters({ search })

  const params: ReceiptsParams = { page: filterState.page, search: filterState.search || undefined }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...adminKeys.receipts, params],
    queryFn: () => fetchReceipts(params),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch receipts')
  }, [isError, error])

  return (
    <div className="min-w-0">
      <PageHeader title={t('receipts.title')} description={t('receipts.description')} />
      {isError ? (
        <QueryError error={error} title={t('receipts.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry receipts failed')} />
      ) : (
        <DataTable
          columns={columns(t)}
          data={data?.data ?? []}
          config={tableConfig(t)}
          filterState={filterState}
          onSearchChange={setSearch}
          onSetFilter={setFilter}
          onClearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          pageCount={data?.pagination.total_pages ?? 1}
          totalRows={data?.pagination.total ?? 0}
          pageSize={data?.pagination.per_page}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
