import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getRouteApi } from '@tanstack/react-router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { FieldGroup } from '@app/ui/components/field'
import { InputField, SelectField, SwitchField } from '@app/ui/components/fields'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { DataTable, useDataTableFilters } from '#/components/data-table'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, normalizeDecimal } from '#/lib/money'
import { adminKeys } from '#/lib/query-keys'
import { Currency, parseCurrency } from '#/types/money'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { DataTableConfig } from '#/components/data-table'
import { deletePriceListItem, fetchPriceList, savePriceListItem } from '../api/price-list.api'
import { PriceItemType, parsePriceItemType } from '../types'
import type { PriceListItem, PriceListParams } from '../types'
import { priceListItemSchema } from '../validation/price-list-item.schema'

const routeApi = getRouteApi('/_authed/cenovnik')
const comma = (value: string | null) => (value ? String(Number(value)).replace('.', ',') : '')
const TYPES = [PriceItemType.Service, PriceItemType.Material, PriceItemType.Other]

function tableConfig(t: TFunction): DataTableConfig<PriceListItem> {
  return {
    searchColumn: 'name',
    searchPlaceholder: t('priceList.searchPlaceholder'),
    manualPagination: true,
    manualFiltering: true,
    pinnedRightColumns: ['actions'],
    getRowId: (item) => String(item.id),
    filterBuilder: [
      {
        id: 'type',
        label: t('priceList.columns.type'),
        type: 'select',
        key: 'type',
        options: TYPES.map((type) => ({ label: t(`items.type.${type}`), value: String(type) })),
      },
    ],
  }
}

function columns(t: TFunction, onEdit: (item: PriceListItem) => void, onDelete: (item: PriceListItem) => void): ColumnDef<PriceListItem>[] {
  return [
    { accessorKey: 'name', header: () => t('priceList.columns.name'), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: 'type', header: () => t('priceList.columns.type'), cell: ({ row }) => <Badge variant="secondary">{t(`items.type.${row.original.type}`)}</Badge> },
    { accessorKey: 'unit', header: () => t('priceList.columns.unit') },
    {
      id: 'purchase',
      header: () => t('priceList.columns.purchase'),
      meta: { className: 'text-right' },
      cell: ({ row }) => (row.original.purchase_price ? formatAmount(row.original.purchase_price, row.original.currency) : ''),
    },
    {
      id: 'sale',
      header: () => t('priceList.columns.sale'),
      meta: { className: 'text-right' },
      cell: ({ row }) => (row.original.sale_price ? formatAmount(row.original.sale_price, row.original.currency) : ''),
    },
    { id: 'active', header: () => t('priceList.columns.active'), cell: ({ row }) => (row.original.is_active ? t('common.yes') : t('common.no')) },
    {
      id: 'actions',
      meta: { className: 'w-px text-right' },
      header: () => <span className="sr-only">{t('table.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(row.original)} aria-label={t('common.edit')}>
            <PencilIcon />
          </Button>
          <ConfirmBubble message={t('priceList.delete.confirm')} onConfirm={() => onDelete(row.original)}>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
              <Trash2Icon />
            </Button>
          </ConfirmBubble>
        </div>
      ),
    },
  ]
}

export function PriceListPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const search = routeApi.useSearch()
  const [editing, setEditing] = useState<PriceListItem | 'new' | undefined>(undefined)
  const { filterState, setSearch, setPage, setFilter, clearAllFilters, hasActiveFilters } = useDataTableFilters({ search })

  const params: PriceListParams = {
    page: filterState.page,
    search: filterState.search || undefined,
    type: parsePriceItemType(filterState.filters.type),
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...adminKeys.priceList, params],
    queryFn: () => fetchPriceList(params),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch price list')
  }, [isError, error])

  const deleteMutation = useMutation({
    mutationFn: (item: PriceListItem) => deletePriceListItem(item.id),
    onSuccess: (response) => toast.success(response.message),
    onError: (err: unknown) => {
      logger.error({ err }, 'Failed to delete price list item')
      toast.error(getApiErrorMessage(err, t('priceList.delete.failed')))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.priceList }),
  })

  return (
    <div className="min-w-0">
      <PageHeader
        title={t('priceList.title')}
        description={t('priceList.description')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <PlusIcon /> <span className="hidden sm:inline">{t('priceList.add')}</span>
          </Button>
        }
      />
      {isError ? (
        <QueryError error={error} title={t('priceList.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry price list failed')} />
      ) : (
        <DataTable
          columns={columns(t, (item) => setEditing(item), (item) => deleteMutation.mutate(item))}
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
      {editing !== undefined && (
        <PriceItemDialog
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}

function PriceItemDialog({ item, onClose }: { item?: PriceListItem; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof savePriceListItem>[0]) => savePriceListItem(payload, item?.id),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      logOnFail(() => queryClient.invalidateQueries({ queryKey: adminKeys.priceList }), 'Invalidate price list failed')
      onClose()
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save price list item')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('priceList.saveFailed')))
    },
  })

  const form = useForm({
    defaultValues: {
      type: String(item?.type ?? PriceItemType.Service),
      currency: String(item?.currency ?? Currency.EUR),
      name: item?.name ?? '',
      unit: item?.unit ?? 'kom',
      purchase_price: comma(item?.purchase_price ?? null),
      sale_price: comma(item?.sale_price ?? null),
      is_active: item?.is_active ?? true,
    },
    validators: { onSubmit: priceListItemSchema(t) },
    onSubmit: ({ value }) => {
      const type = parsePriceItemType(value.type)
      const currency = parseCurrency(value.currency)
      if (type === undefined || currency === undefined) return
      mutation.mutate({
        type,
        currency,
        name: value.name.trim(),
        unit: value.unit.trim() || 'kom',
        purchase_price: value.purchase_price.trim() ? normalizeDecimal(value.purchase_price) : null,
        sale_price: value.sale_price.trim() ? normalizeDecimal(value.sale_price) : null,
        is_active: value.is_active,
      })
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? t('priceList.edit') : t('priceList.create')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Price list form submission failed')
          }}
          className="space-y-4"
        >
          <FieldGroup className="grid grid-cols-2 gap-3">
            <SelectField form={form} name="type" label={t('items.form.type')} options={TYPES.map((type) => ({ value: String(type), label: t(`items.type.${type}`) }))} />
            <SelectField form={form} name="currency" label={t('items.form.currency')} options={[Currency.EUR, Currency.RSD].map((c) => ({ value: String(c), label: t(`currency.${c}`) }))} />
            <InputField form={form} name="name" label={t('items.form.name')} className="col-span-2" />
            <InputField form={form} name="unit" label={t('items.form.unit')} />
            <div />
            <InputField form={form} name="purchase_price" label={t('priceList.columns.purchase')} inputProps={{ inputMode: 'decimal' }} />
            <InputField form={form} name="sale_price" label={t('priceList.columns.sale')} inputProps={{ inputMode: 'decimal' }} />
            <SwitchField form={form} name="is_active" label={t('priceList.form.active')} className="col-span-2" />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? t('common.saving') : t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
