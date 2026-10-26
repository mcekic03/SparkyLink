import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, getRouteApi } from '@tanstack/react-router'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { DataTable, useDataTableFilters } from '#/components/data-table'
import { PageHeader } from '#/components/page-header'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { Button } from '@app/ui/components/button'
import { getApiErrorMessage } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { usersTableConfig, usersColumns } from '../config/users-table-config'
import { deleteUser, fetchUsers } from '../api/users.api'
import { usersKeys } from '../api/users.keys'
import { parseUserRole } from '../types'

const routeApi = getRouteApi('/_authed/users/')

export function UsersPage() {
  const { t } = useTranslation()
  const tableConfig = usersTableConfig(t)
  const search = routeApi.useSearch()
  const queryClient = useQueryClient()

  const {
    filterState,
    setSearch,
    setPage,
    setFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useDataTableFilters({ search })

  const params = {
    page: filterState.page,
    search: filterState.search || undefined,
    role_id: parseUserRole(filterState.filters.role_id),
  }

  const deleteMutation = useMutation({
    // One request per user: the API deletes by id and has no bulk route.
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteUser(id))),
    onSuccess: (responses) => {
      // A single delete echoes the API's own message; a bulk one has as many
      // messages as rows, so it gets a summary instead.
      const [first] = responses
      toast.success(
        responses.length === 1
          ? first.message
          : t('users.delete.selectedSuccess'),
      )
    },
    onError: (mutationError: unknown, ids) => {
      logger.error({ err: mutationError, ids }, 'Failed to delete users')
      toast.error(
        getApiErrorMessage(
          mutationError,
          ids.length === 1
            ? t('users.delete.failed')
            : t('users.delete.selectedFailed'),
        ),
      )
    },
    // Settled, not success: `Promise.all` rejects on the first failure, and the
    // ones that already went through are gone either way. Refetching only on
    // success would leave deleted rows on screen.
    onSettled: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  })

  // Confirmation lives in the bubble the row's button opens — see ConfirmBubble.
  const columns = usersColumns(t, {
    onDelete: (user) => deleteMutation.mutate([String(user.id)]),
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) {
      logger.error({ err: error }, 'Failed to fetch users')
    }
  }, [isError, error])

  return (
    <div className="min-w-0">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button asChild>
            <Link to="/users/new">
              <PlusIcon /> {t('users.create.action')}
            </Link>
          </Button>
        }
      />
      {isError ? (
        <QueryError
          error={error}
          title={t('users.loadFailed')}
          onRetry={() =>
            logOnFail(() => refetch(), 'Retry fetching users failed')
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          config={tableConfig}
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
          renderBulkActions={({ selectedRows, clearSelection }) => (
            <ConfirmBubble
              side="bottom"
              message={t('users.delete.confirmSelected')}
              onConfirm={() =>
                deleteMutation.mutate(
                  selectedRows.map((user) => String(user.id)),
                  { onSuccess: clearSelection },
                )
              }
            >
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                disabled={deleteMutation.isPending}
              >
                <Trash2Icon className="mr-1 size-4" />
                {deleteMutation.isPending
                  ? t('users.delete.pending')
                  : t('users.delete.selected')}
              </Button>
            </ConfirmBubble>
          )}
        />
      )}
    </div>
  )
}
