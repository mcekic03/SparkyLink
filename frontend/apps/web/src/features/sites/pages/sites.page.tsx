import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, getRouteApi } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { DataTable, useDataTableFilters } from '#/components/data-table'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { fetchSites } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { sitesColumns, sitesTableConfig } from '../config/sites-table-config'
import { parsePaymentStatus, parseSiteStatus } from '../types'
import type { SitesParams } from '../types'

const routeApi = getRouteApi('/_authed/gradilista/')

export function SitesPage() {
  const { t } = useTranslation()
  const search = routeApi.useSearch()

  const { filterState, setSearch, setPage, setFilter, clearAllFilters, hasActiveFilters } = useDataTableFilters({ search })

  const params: SitesParams = {
    page: filterState.page,
    search: filterState.search || undefined,
    status: parseSiteStatus(filterState.filters.status),
    payment_status: parsePaymentStatus(filterState.filters.payment_status),
    trashed: filterState.filters.trashed === '1' ? 1 : undefined,
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.list(params),
    queryFn: () => fetchSites(params),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch sites')
  }, [isError, error])

  return (
    <div className="min-w-0">
      <PageHeader
        title={t('sites.title')}
        description={t('sites.description')}
        actions={
          <Button asChild>
            <Link to="/gradilista/novo">
              <PlusIcon /> <span className="hidden sm:inline">{t('sites.create.action')}</span>
            </Link>
          </Button>
        }
      />
      {isError ? (
        <QueryError
          error={error}
          title={t('sites.loadFailed')}
          onRetry={() => logOnFail(() => refetch(), 'Retry fetching sites failed')}
        />
      ) : (
        <DataTable
          columns={sitesColumns(t)}
          data={data?.data ?? []}
          config={sitesTableConfig(t)}
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
