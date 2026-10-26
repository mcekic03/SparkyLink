import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { FileTextIcon, Trash2Icon } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/alert'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { FieldGroup } from '@app/ui/components/field'
import { DatePickerField, SwitchField, TextareaField } from '@app/ui/components/fields'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { formatDay, todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount } from '#/lib/money'
import { createDocument, deleteDocument, fetchDocuments } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import { DocumentType } from '../types'
import type { Site } from '../types'
import { documentFormSchema } from '../validation/money-forms.schema'

export function DocumentsTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState<DocumentType | undefined>(undefined)

  const { data: documents, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.documents(site.id),
    queryFn: () => fetchDocuments(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch documents')
  }, [isError, error])

  const deleteMutation = useDeleteMutation((id: number) => deleteDocument(id), t('documents.delete.failed'))

  if (isError) {
    return <QueryError error={error} title={t('documents.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry documents failed')} />
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t('documents.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('documents.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setCreating(DocumentType.Offer)}>
            {t('documents.createOffer')}
          </Button>
          <Button size="sm" onClick={() => setCreating(DocumentType.FinalInvoice)}>
            {t('documents.createInvoice')}
          </Button>
        </div>
      </div>

      {documents && documents.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('documents.empty')}</p>
      )}

      <ul className="divide-y rounded-lg border bg-card">
        {documents?.map((document) => (
          <li key={document.id} className="flex items-center gap-3 px-3 py-2.5">
            <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">
                  {t(`documents.type.${document.type}`)} {document.number}
                </span>
                <Badge variant={document.type === DocumentType.Offer ? 'outline' : 'secondary'}>{formatDay(document.issued_at)}</Badge>
              </span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {t('documents.columns.total')}: {formatAmount(document.total_amount, document.currency)}
                {document.type === DocumentType.FinalInvoice &&
                  ` · ${t('documents.columns.balance')}: ${formatAmount(document.balance_amount, document.currency)}`}
              </span>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href={document.pdf_url} target="_blank" rel="noreferrer">
                {t('documents.openPdf')}
              </a>
            </Button>
            <ConfirmBubble message={t('documents.delete.confirm')} onConfirm={() => deleteMutation.mutate(document.id)}>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
                <Trash2Icon />
              </Button>
            </ConfirmBubble>
          </li>
        ))}
      </ul>

      {creating !== undefined && (
        <DocumentDialog site={site} type={creating} open onOpenChange={(open) => !open && setCreating(undefined)} />
      )}
    </div>
  )
}

function DocumentDialog({ site, type, open, onOpenChange }: { site: Site; type: DocumentType; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const isOffer = type === DocumentType.Offer

  const mutation = useMutation({
    mutationFn: (payload: { issued_at: string; note?: string; is_itemized: boolean }) => createDocument(site.id, { type, ...payload }),
    onSuccess: (response) => {
      toast.success(response.message ?? '', {
        action: { label: t('documents.openPdf'), onClick: () => window.open(response.data.pdf_url, '_blank', 'noopener') },
        duration: 10_000,
      })
      invalidate()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to create document')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('documents.createFailed')))
    },
  })

  const form = useForm({
    defaultValues: { issued_at: todayIso(), note: '', is_itemized: true },
    validators: { onSubmit: documentFormSchema(t) },
    onSubmit: ({ value }) =>
      mutation.mutate({ issued_at: value.issued_at, note: value.note.trim() || undefined, is_itemized: value.is_itemized }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isOffer ? t('documents.form.offerTitle') : t('documents.form.invoiceTitle')}</DialogTitle>
          <DialogDescription>{site.name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Document form submission failed')
          }}
          className="space-y-4"
        >
          <Alert>
            <AlertDescription>{isOffer ? t('documents.form.offerHint') : t('documents.form.invoiceHint')}</AlertDescription>
          </Alert>
          <FieldGroup className="gap-3">
            <DatePickerField form={form} name="issued_at" label={t('documents.form.issuedAt')} />
            <SwitchField form={form} name="is_itemized" label={t('documents.form.itemized')} description={t('documents.form.itemizedHint')} />
            <TextareaField form={form} name="note" label={t('documents.form.note')} />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('documents.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
