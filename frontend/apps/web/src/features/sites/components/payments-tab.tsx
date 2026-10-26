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
import { formatAmount, normalizeDecimal } from '#/lib/money'
import { Currency, otherCurrency, parseCurrency } from '#/types/money'
import { deletePayment, fetchPayments, savePayment } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useExchangeRate } from '../api/use-exchange-rate'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import type { Payment, PaymentPayload, Site } from '../types'
import { paymentFormSchema } from '../validation/money-forms.schema'

const comma = (value: string) => value.replace('.', ',')

function amountIn(payment: Payment, currency: Currency): string {
  return currency === Currency.EUR ? payment.amount_eur : payment.amount_rsd
}

export function PaymentsTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<Payment | undefined>(undefined)
  const [creating, setCreating] = useState(false)

  const { data: payments, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.payments(site.id),
    queryFn: () => fetchPayments(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch payments')
  }, [isError, error])

  const deleteMutation = useDeleteMutation((id: number) => deletePayment(id), t('payments.delete.failed'))

  if (isError) {
    return <QueryError error={error} title={t('payments.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry payments failed')} />
  }

  const other = otherCurrency(site.currency)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t('payments.title')}</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <PlusIcon /> {t('payments.add')}
        </Button>
      </div>

      {payments && payments.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('payments.empty')}</p>
      )}

      <ul className="divide-y rounded-lg border bg-card">
        {payments?.map((payment) => (
          <li key={payment.id} className="flex items-start gap-3 px-3 py-2.5">
            <button type="button" onClick={() => setEditing(payment)} className="min-w-0 flex-1 text-left">
              <span className="font-medium">{formatDay(payment.paid_at)}</span>
              {payment.note && <span className="mt-0.5 block text-xs text-muted-foreground">{payment.note}</span>}
            </button>
            <div className="shrink-0 text-right text-sm tabular-nums">
              <span className="block font-medium text-emerald-700 dark:text-emerald-400">
                {formatAmount(amountIn(payment, site.currency), site.currency)}
              </span>
              <span className="block text-xs text-muted-foreground">{formatAmount(amountIn(payment, other), other)}</span>
            </div>
            <ConfirmBubble message={t('payments.delete.confirm')} onConfirm={() => deleteMutation.mutate(payment.id)}>
              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
                <Trash2Icon />
              </Button>
            </ConfirmBubble>
          </li>
        ))}
      </ul>

      {creating && <PaymentDialog site={site} open onOpenChange={setCreating} />}
      {editing && <PaymentDialog key={editing.id} site={site} payment={editing} open onOpenChange={(open) => !open && setEditing(undefined)} />}
    </div>
  )
}

function PaymentDialog({ site, payment, open, onOpenChange }: { site: Site; payment?: Payment; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [rateTouched, setRateTouched] = useState(payment !== undefined)
  const currencyOptions = [Currency.EUR, Currency.RSD].map((currency) => ({ value: String(currency), label: t(`currency.${currency}`) }))

  const mutation = useMutation({
    mutationFn: (payload: PaymentPayload) => savePayment(site.id, payload, payment?.id),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save payment')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('payments.saveFailed')))
    },
  })

  const form = useForm({
    defaultValues: {
      currency: String(payment?.currency ?? site.currency),
      amount: payment ? comma(String(Number(payment.amount))) : '',
      paid_at: payment?.paid_at ?? todayIso(),
      exchange_rate: payment ? comma(payment.exchange_rate) : '',
      note: payment?.note ?? '',
    },
    validators: { onSubmit: paymentFormSchema(t) },
    onSubmit: ({ value }) => {
      const currency = parseCurrency(value.currency)
      if (currency === undefined) return
      mutation.mutate({
        currency,
        amount: normalizeDecimal(value.amount) ?? value.amount,
        paid_at: value.paid_at,
        exchange_rate: normalizeDecimal(value.exchange_rate) ?? undefined,
        note: value.note.trim() || undefined,
      })
    },
  })

  const day = useStore(form.store, (state) => state.values.paid_at)
  const rateQuery = useExchangeRate(day)

  useEffect(() => {
    if (!rateTouched && rateQuery.data) form.setFieldValue('exchange_rate', comma(rateQuery.data))
  }, [rateQuery.data, rateTouched, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{payment ? t('payments.edit') : t('payments.create')}</DialogTitle>
          <DialogDescription>{site.name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Payment form submission failed')
          }}
          className="space-y-4"
        >
          <FieldGroup className="grid grid-cols-2 gap-3">
            <InputField form={form} name="amount" label={t('payments.form.amount')} inputProps={{ inputMode: 'decimal' }} />
            <SelectField form={form} name="currency" label={t('payments.form.currency')} options={currencyOptions} />
            <DatePickerField form={form} name="paid_at" label={t('payments.form.date')} />
            <InputField
              form={form}
              name="exchange_rate"
              label={t('payments.form.rate')}
              inputProps={{ inputMode: 'decimal', onInput: () => setRateTouched(true) }}
            />
            <InputField form={form} name="note" label={t('payments.form.note')} className="col-span-2" />
          </FieldGroup>
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
