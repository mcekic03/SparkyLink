import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PrinterIcon, ReceiptTextIcon, RefreshCwIcon, ScanLineIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { getApiErrorMessage } from '#/lib/api-error'
import { formatDateTime } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount } from '#/lib/money'
import { Currency } from '#/types/money'
import { deleteReceipt, fetchReceipt, fetchSiteReceipts, importReceiptItems, refetchReceipt } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import { ItemType, ReceiptStatus } from '../types'
import type { Receipt, Site } from '../types'
import { ReceiptItemsEditor, rowsFrom, selectedItems } from './receipt-items-editor'
import type { EditableRow } from './receipt-items-editor'
import { ReceiptScannerDialog } from './receipt-scanner-dialog'

export function ReceiptsTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [scanning, setScanning] = useState(false)
  const [openId, setOpenId] = useState<number | undefined>(undefined)

  const { data: receipts, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.receipts(site.id),
    queryFn: () => fetchSiteReceipts(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch receipts')
  }, [isError, error])

  if (isError) {
    return <QueryError error={error} title={t('receipts.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry receipts failed')} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t('receipts.siteTitle')}</h2>
        <Button size="sm" onClick={() => setScanning(true)}>
          <ScanLineIcon /> {t('receipts.scan')}
        </Button>
      </div>

      {receipts && receipts.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('receipts.empty')}</p>
      )}

      <ul className="divide-y rounded-lg border bg-card">
        {receipts?.map((receipt) => (
          <li key={receipt.id}>
            <button type="button" onClick={() => setOpenId(receipt.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50">
              <ReceiptTextIcon className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{receipt.store_name ?? t('receipts.photo')}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatDateTime(receipt.issued_at ?? receipt.created_at)}
                  {receipt.items_count ? ` · ${String(receipt.items_count)} ${t('receipts.columns.items').toLowerCase()}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {receipt.total_amount && <span className="block text-sm font-medium tabular-nums">{formatAmount(receipt.total_amount, Currency.RSD)}</span>}
                {receipt.status !== ReceiptStatus.Fetched && <Badge variant="outline">{t(`receipts.status.${receipt.status}`)}</Badge>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {scanning && <ReceiptScannerDialog site={site} open onOpenChange={setScanning} />}
      {openId !== undefined && (
        <ReceiptDetailDialog receiptId={openId} site={site} onClose={() => setOpenId(undefined)} />
      )}
    </div>
  )
}

function ReceiptDetailDialog({ receiptId, site, onClose }: { receiptId: number; site: Site; onClose: () => void }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [importing, setImporting] = useState<EditableRow[] | undefined>(undefined)
  const [markup, setMarkup] = useState((site.effective_markup_percent ?? '20').replace('.', ','))

  const { data: receipt, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.receipt(receiptId),
    queryFn: () => fetchReceipt(receiptId),
  })

  const deleteMutation = useDeleteMutation((id: number) => deleteReceipt(id), t('receipts.delete.failed'))

  const refetchMutation = useMutation({
    mutationFn: (id: number) => refetchReceipt(id),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Refetching receipt failed')
      toast.error(getApiErrorMessage(err, t('receipts.previewFailed')))
    },
  })

  const importMutation = useMutation({
    mutationFn: ({ id, rows }: { id: number; rows: EditableRow[] }) => importReceiptItems(id, selectedItems(rows)),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
      setImporting(undefined)
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Importing receipt items failed')
      toast.error(getApiErrorMessage(err, t('receipts.saveFailed')))
    },
  })

  const startImport = (current: Receipt) => {
    const factor = 1 + Number(markup.replace(',', '.')) / 100
    setImporting(
      rowsFrom(
        (current.items_data ?? []).map((line) => ({
          type: ItemType.Material,
          name: line.name,
          unit: line.unit,
          quantity: line.quantity,
          purchase_price: line.unit_price,
          sale_price: String(Math.round(Number(line.unit_price) * factor * 100) / 100),
          total: line.total,
          is_billable: true,
        })),
      ),
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[94svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{receipt?.store_name ?? t('receipts.photo')}</DialogTitle>
          <DialogDescription>
            {receipt ? `${formatDateTime(receipt.issued_at ?? receipt.created_at)} · ${t(`receipts.status.${receipt.status}`)}` : t('common.loading')}
          </DialogDescription>
        </DialogHeader>

        {isError && <QueryError error={error} title={t('receipts.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry receipt failed')} />}

        {receipt && !importing && (
          <div className="space-y-4">
            {receipt.total_amount && (
              <p className="text-sm">
                {t('receipts.columns.total')}: <strong>{formatAmount(receipt.total_amount, Currency.RSD)}</strong>
                {receipt.receipt_number ? ` · ${receipt.receipt_number}` : ''}
              </p>
            )}
            {receipt.note && <p className="rounded-md bg-muted px-3 py-2 text-sm">{receipt.note}</p>}
            {receipt.fetch_error && receipt.status !== ReceiptStatus.Fetched && (
              <p className="text-xs text-muted-foreground">{t('receipts.fetchError', { error: receipt.fetch_error })}</p>
            )}
            {receipt.journal && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('receipts.journal')}</p>
                <pre className="max-h-80 overflow-auto rounded-md border bg-white p-3 font-mono text-[11px] leading-snug text-black">{receipt.journal}</pre>
              </div>
            )}
            {receipt.photo_url && (
              <a href={receipt.photo_url} target="_blank" rel="noreferrer">
                <img src={receipt.photo_url} alt={t('receipts.photo')} className="max-h-96 rounded-md border object-contain" />
              </a>
            )}
          </div>
        )}

        {receipt && importing && (
          <ReceiptItemsEditor rows={importing} onChange={setImporting} markup={markup} onMarkupChange={setMarkup} />
        )}

        {receipt && (
          <DialogFooter className="flex-wrap gap-2">
            {importing ? (
              <>
                <Button variant="outline" onClick={() => setImporting(undefined)}>{t('common.back')}</Button>
                <Button onClick={() => importMutation.mutate({ id: receipt.id, rows: importing })} disabled={importMutation.isPending}>
                  {importMutation.isPending ? t('receipts.preview.importing') : t('receipts.importItems')}
                </Button>
              </>
            ) : (
              <>
                <ConfirmBubble message={t('receipts.delete.confirm')} onConfirm={() => deleteMutation.mutate(receipt.id, { onSuccess: onClose })} side="top">
                  <Button variant="outline" className="text-destructive">
                    <Trash2Icon /> {t('common.delete')}
                  </Button>
                </ConfirmBubble>
                {(receipt.status === ReceiptStatus.Pending || receipt.status === ReceiptStatus.Failed) && (
                  <Button variant="outline" onClick={() => refetchMutation.mutate(receipt.id)} disabled={refetchMutation.isPending}>
                    <RefreshCwIcon /> {t('receipts.refetch')}
                  </Button>
                )}
                {receipt.status === ReceiptStatus.Fetched && receipt.items_count === 0 && (receipt.items_data?.length ?? 0) > 0 && (
                  <Button variant="outline" onClick={() => startImport(receipt)}>
                    {t('receipts.importItems')}
                  </Button>
                )}
                <Button asChild>
                  <a href={receipt.copy_url} target="_blank" rel="noreferrer">
                    <PrinterIcon /> {t('receipts.copy')}
                  </a>
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
