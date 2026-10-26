import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { FieldGroup } from '@app/ui/components/field'
import { DatePickerField, InputField, SelectField } from '@app/ui/components/fields'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { formatDay, todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, formatQuantity, normalizeDecimal } from '#/lib/money'
import { Currency, otherCurrency, parseCurrency } from '#/types/money'
import { deleteLabor, fetchLabor, saveLabor } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useExchangeRate } from '../api/use-exchange-rate'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import type { LaborEntry, LaborPayload, Site } from '../types'
import { laborFormSchema } from '../validation/money-forms.schema'

const comma = (value: string) => value.replace('.', ',')

function totalIn(entry: LaborEntry, currency: Currency): string {
  return currency === Currency.EUR ? entry.total_eur : entry.total_rsd
}

export function LaborTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<LaborEntry | undefined>(undefined)
  const [creating, setCreating] = useState(false)

  const { data: entries, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.labor(site.id),
    queryFn: () => fetchLabor(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch labor')
  }, [isError, error])

  const deleteMutation = useDeleteMutation((id: number) => deleteLabor(id), t('labor.delete.failed'))

  if (isError) {
    return <QueryError error={error} title={t('labor.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry labor failed')} />
  }

  const other = otherCurrency(site.currency)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t('labor.title')}</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <PlusIcon /> {t('labor.add')}
        </Button>
      </div>

      {entries && entries.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('labor.empty')}</p>
      )}

      <ul className="divide-y rounded-lg border bg-card">
        {entries?.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
            <button type="button" onClick={() => setEditing(entry)} className="min-w-0 flex-1 text-left">
              <span className="font-medium">{formatDay(entry.worked_at)}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                {entry.workers_count} × {formatQuantity(entry.hours)} h × {formatAmount(entry.hourly_rate, entry.currency)}
                {entry.description ? ` · ${entry.description}` : ''}
              </span>
            </button>
            <div className="shrink-0 text-right text-sm tabular-nums">
              <span className="block font-medium">{formatAmount(totalIn(entry, site.currency), site.currency)}</span>
              <span className="block text-xs text-muted-foreground">{formatAmount(totalIn(entry, other), other)}</span>
            </div>
            <ConfirmBubble message={t('labor.delete.confirm')} onConfirm={() => deleteMutation.mutate(entry.id)}>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
                <Trash2Icon />
              </Button>
            </ConfirmBubble>
          </li>
        ))}
      </ul>

      {creating && <LaborDialog site={site} open onOpenChange={setCreating} />}
      {editing && <LaborDialog key={editing.id} site={site} entry={editing} open onOpenChange={(open) => !open && setEditing(undefined)} />}
    </div>
  )
}

function LaborDialog({ site, entry, open, onOpenChange }: { site: Site; entry?: LaborEntry; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [rateTouched, setRateTouched] = useState(entry !== undefined)
  const currencyOptions = [Currency.RSD, Currency.EUR].map((currency) => ({ value: String(currency), label: t(`currency.${currency}`) }))

  const mutation = useMutation({
    mutationFn: (payload: LaborPayload) => saveLabor(site.id, payload, entry?.id),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save labor')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('labor.saveFailed')))
    },
  })

  const form = useForm({
    defaultValues: {
      currency: String(entry?.currency ?? Currency.RSD),
      workers_count: String(entry?.workers_count ?? 1),
      hours: entry ? comma(String(Number(entry.hours))) : '8',
      hourly_rate: entry ? comma(String(Number(entry.hourly_rate))) : '',
      worked_at: entry?.worked_at ?? todayIso(),
      exchange_rate: entry ? comma(entry.exchange_rate) : '',
      description: entry?.description ?? '',
    },
    validators: { onSubmit: laborFormSchema(t) },
    onSubmit: ({ value }) => {
      const currency = parseCurrency(value.currency)
      if (currency === undefined) return
      mutation.mutate({
        currency,
        workers_count: Number(value.workers_count),
        hours: normalizeDecimal(value.hours) ?? value.hours,
        hourly_rate: normalizeDecimal(value.hourly_rate) ?? value.hourly_rate,
        worked_at: value.worked_at,
        exchange_rate: normalizeDecimal(value.exchange_rate) ?? undefined,
        description: value.description.trim() || undefined,
      })
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const rateQuery = useExchangeRate(values.worked_at)

  useEffect(() => {
    if (!rateTouched && rateQuery.data) form.setFieldValue('exchange_rate', comma(rateQuery.data))
  }, [rateQuery.data, rateTouched, form])

  const total =
    Number(values.workers_count || 0) * Number(normalizeDecimal(values.hours) ?? 0) * Number(normalizeDecimal(values.hourly_rate) ?? 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? t('labor.edit') : t('labor.create')}</DialogTitle>
          <DialogDescription>{site.name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Labor form submission failed')
          }}
          className="space-y-4"
        >
          <FieldGroup className="grid grid-cols-2 gap-3">
            <DatePickerField form={form} name="worked_at" label={t('labor.form.date')} className="col-span-2" />
            <InputField form={form} name="workers_count" type="number" label={t('labor.form.workers')} />
            <InputField form={form} name="hours" label={t('labor.form.hours')} inputProps={{ inputMode: 'decimal' }} />
            <InputField form={form} name="hourly_rate" label={t('labor.form.hourlyRate')} inputProps={{ inputMode: 'decimal' }} />
            <SelectField form={form} name="currency" label={t('labor.form.currency')} options={currencyOptions} />
            <InputField
              form={form}
              name="exchange_rate"
              label={t('labor.form.rate')}
              inputProps={{ inputMode: 'decimal', onInput: () => setRateTouched(true) }}
              className="col-span-2"
            />
            <InputField form={form} name="description" label={t('labor.form.description')} className="col-span-2" />
          </FieldGroup>
          <p className="rounded-md bg-muted px-3 py-2 text-sm font-medium tabular-nums">
            {t('labor.form.total', { total: formatAmount(total, parseCurrency(values.currency) ?? Currency.RSD) })}
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
