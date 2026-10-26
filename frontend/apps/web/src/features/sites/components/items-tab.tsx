import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { FileSpreadsheetIcon, PlusIcon, ScanLineIcon, SearchIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import { Checkbox } from '@app/ui/components/checkbox'
import { Input } from '@app/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/ui/components/select'
import { cn } from '@app/ui/lib/utils'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { formatDay } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, formatQuantity } from '#/lib/money'
import { Currency, otherCurrency, pairValue } from '#/types/money'
import { deleteItem, fetchItems } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useDeleteMutation } from '../api/use-site-mutation'
import { SOURCES, filterItems, hasSourceFilter, sourceCounts } from '../lib/item-filters'
import type { SourceFilter } from '../lib/item-filters'
import { canHavePurchase, importBatches, selectionSums } from '../lib/item-selection'
import { purchaseMissing } from '../lib/purchase-estimate'
import { ItemType } from '../types'
import type { Site, SiteItem } from '../types'
import { ItemDialog } from './item-dialog'
import { ItemsTotals } from './items-totals'
import { PurchasePricesDialog } from './purchase-prices-dialog'
import { ReceiptScannerDialog } from './receipt-scanner-dialog'
import { SpreadsheetImportDialog } from './spreadsheet-import-dialog'

const FILTERS = [undefined, ItemType.Material, ItemType.Service, ItemType.Other] as const

function amountIn(item: SiteItem, currency: Currency, kind: 'sale' | 'purchase'): string {
  const suffix = currency === Currency.EUR ? 'eur' : 'rsd'
  return item[`${kind}_total_${suffix}`]
}

export function ItemsTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<ItemType | undefined>(undefined)
  // Pretraga i izvor važe samo za otvorenu karticu (vrstu stavki).
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<SourceFilter>('all')
  const [editing, setEditing] = useState<SiteItem | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  // Stavke izabrane za zajednički upis nabavne cene.
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set())
  const [pricing, setPricing] = useState(false)

  const { data: items, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.items(site.id),
    queryFn: () => fetchItems(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch items')
  }, [isError, error])

  const deleteMutation = useDeleteMutation((id: number) => deleteItem(id), t('items.delete.failed'))

  if (isError) {
    return <QueryError error={error} title={t('items.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry items failed')} />
  }

  const all = items ?? []
  const visible = filterItems(all, { type: filter, search, source })
  const counts = sourceCounts(all, filter)
  const filtering = search.trim() !== '' || (hasSourceFilter(filter) && source !== 'all')
  const other = otherCurrency(site.currency)
  const batches = importBatches(all)
  const missing = all.filter(purchaseMissing).map((item) => item.id)
  const sums = selectionSums(all, selected)

  // Izbor važi za ono što se vidi, pa ga promena vrste poništava.
  const chooseFilter = (type: ItemType | undefined) => {
    setFilter(type)
    setSelected(new Set())
  }

  const clearFilters = () => {
    setSearch('')
    setSource('all')
  }

  // Brzo biranje prikazuje sve izabrane stavke, pa skida pretragu i filter.
  const choose = (ids: number[]) => {
    setFilter(ItemType.Material)
    clearFilters()
    setSelected(new Set(ids))
  }

  const toggle = (id: number, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <div className="space-y-3">
      {/* Na širokom ekranu zbirovi stoje u sredini reda, uz dugmad; na užem ispod vrsta stavki. */}
      <div className="grid gap-3 xl:grid-cols-[auto_1fr_auto] xl:items-center">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((type) => (
            <Button
              key={type ?? 'all'}
              size="sm"
              variant={filter === type ? 'default' : 'outline'}
              onClick={() => chooseFilter(type)}
            >
              {type === undefined ? t('items.all') : t(`items.type.${type}`)}
            </Button>
          ))}
        </div>
        <ItemsTotals site={site} type={filter} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setScanning(true)}>
            <ScanLineIcon /> {t('receipts.scan')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
            <FileSpreadsheetIcon /> {t('items.import.button')}
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon /> {t('items.add')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('items.filters.search')}
            aria-label={t('items.filters.search')}
            className="h-8 pl-8"
          />
        </div>
        {hasSourceFilter(filter) && (
          <Select value={source} onValueChange={(value) => setSource(SOURCES.find((option) => option === value) ?? 'all')}>
            <SelectTrigger size="sm" className="w-full sm:w-60" aria-label={t('items.filters.source')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`items.filters.sources.${option}`)} ({counts[option]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {filtering && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            {t('items.filters.clear')}
          </Button>
        )}
      </div>

      {(batches.length > 0 || missing.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('items.select.quick')}</span>
          {batches.map((batch) => (
            <Button key={batch.id} size="xs" variant="outline" onClick={() => choose(batch.ids)}>
              <FileSpreadsheetIcon /> {batch.fileName} · {formatDay(batch.createdAt.slice(0, 10))} ({batch.ids.length})
            </Button>
          ))}
          {missing.length > 0 && (
            <Button size="xs" variant="outline" onClick={() => choose(missing)}>
              {t('items.select.missing', { count: missing.length })}
            </Button>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border-2 border-primary bg-card p-3 text-sm shadow-sm">
          <span className="font-medium">{t('items.select.count', { count: sums.count })}</span>
          <span className="tabular-nums">
            {t('items.select.sale')}: <strong>{formatAmount(pairValue(sums.sale, site.currency), site.currency)}</strong>{' '}
            <span className="text-muted-foreground">({formatAmount(pairValue(sums.sale, other), other)})</span>
          </span>
          <span className="tabular-nums text-muted-foreground">
            {t('items.select.purchase')}: {formatAmount(pairValue(sums.purchase, site.currency), site.currency)}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              {t('items.select.clear')}
            </Button>
            <Button size="sm" onClick={() => setPricing(true)}>
              {t('items.select.setPurchase')}
            </Button>
          </div>
        </div>
      )}

      {items && visible.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {filtering ? t('items.filters.none') : t('items.empty')}
        </p>
      )}

      <ul className="divide-y rounded-lg border bg-card">
        {visible.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-3 py-2.5">
            {canHavePurchase(item) ? (
              <Checkbox
                checked={selected.has(item.id)}
                onCheckedChange={(value) => toggle(item.id, value === true)}
                aria-label={t('items.select.one', { name: item.name })}
                className="mt-1"
              />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
            <button type="button" onClick={() => setEditing(item)} className="min-w-0 flex-1 text-left">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{item.name}</span>
                <Badge variant="secondary" className="text-[0.65rem]">{t(`items.type.${item.type}`)}</Badge>
                {!item.is_billable && <Badge variant="outline" className="text-[0.65rem]">{t('items.notBilled')}</Badge>}
                {item.receipt_id && <Badge variant="outline" className="text-[0.65rem]">{t('items.fromReceipt')}</Badge>}
                {item.item_import_id && (
                  <Badge variant="outline" className="text-[0.65rem]" title={item.item_import?.file_name}>
                    {t('items.fromImport')}
                  </Badge>
                )}
                {purchaseMissing(item) && (
                  <Badge variant="outline" className="border-primary bg-primary/15 text-[0.65rem] text-foreground">
                    {t('items.noPurchasePrice')}
                  </Badge>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                {formatQuantity(item.quantity)} {item.unit} × {formatAmount(item.sale_price, item.currency)} · {formatDay(item.occurred_at)}
              </span>
            </button>
            <div className="shrink-0 text-right text-sm tabular-nums">
              <span className={cn('block font-medium', !item.is_billable && 'text-muted-foreground line-through')}>
                {formatAmount(amountIn(item, site.currency, 'sale'), site.currency)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {formatAmount(amountIn(item, other, 'sale'), other)}
              </span>
              {item.type !== ItemType.Service && (
                <span className="block text-xs text-muted-foreground">
                  {t('items.columns.purchase')}: {formatAmount(amountIn(item, site.currency, 'purchase'), site.currency)}
                </span>
              )}
            </div>
            <ConfirmBubble message={t('items.delete.confirm')} onConfirm={() => deleteMutation.mutate(item.id)}>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
                <Trash2Icon />
              </Button>
            </ConfirmBubble>
          </li>
        ))}
      </ul>

      {creating && (
        <ItemDialog site={site} defaultType={filter ?? ItemType.Material} open={creating} onOpenChange={setCreating} />
      )}
      {editing && (
        <ItemDialog key={editing.id} site={site} item={editing} open onOpenChange={(open) => !open && setEditing(undefined)} />
      )}
      {scanning && <ReceiptScannerDialog site={site} open={scanning} onOpenChange={setScanning} />}
      {importing && <SpreadsheetImportDialog site={site} open={importing} onOpenChange={setImporting} />}
      {pricing && (
        <PurchasePricesDialog
          site={site}
          items={all}
          ids={selected}
          open={pricing}
          onOpenChange={setPricing}
          onDone={() => {
            setPricing(false)
            setSelected(new Set())
          }}
        />
      )}
    </div>
  )
}
