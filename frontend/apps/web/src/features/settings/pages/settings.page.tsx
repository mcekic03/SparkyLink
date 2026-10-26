import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { UploadIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { FieldGroup } from '@app/ui/components/field'
import { InputField, SelectField, TextareaField } from '@app/ui/components/fields'
import { Input } from '@app/ui/components/input'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { formatDay, todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatRate, normalizeDecimal } from '#/lib/money'
import { adminKeys } from '#/lib/query-keys'
import { Currency } from '#/types/money'
import { fetchExchangeRates, fetchSettings, saveExchangeRate, updateSettings, uploadLogo } from '../api/settings.api'
import type { Settings } from '../api/settings.api'
import { settingsFormSchema } from '../validation/settings.schema'

export function SettingsPage() {
  const { t } = useTranslation()
  const { data, isError, error, refetch } = useQuery({ queryKey: adminKeys.settings, queryFn: fetchSettings })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch settings')
  }, [isError, error])

  return (
    <div className="min-w-0">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      {isError && <QueryError error={error} title={t('settings.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry settings failed')} />}
      {data && (
        <div className="grid max-w-4xl gap-5">
          <LogoCard settings={data} />
          <SettingsForm settings={data} />
          <RatesCard />
        </div>
      )}
    </div>
  )
}

function LogoCard({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: uploadLogo,
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      queryClient.setQueryData(adminKeys.settings, response.data)
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Logo upload failed')
      toast.error(getApiErrorMessage(err, t('settings.logo.failed')))
    },
  })

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 sm:p-5">
      <img src={settings.logo_url} alt={settings.company_name} className="h-20 w-auto rounded bg-white p-1" />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold">{t('settings.logo.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.logo.description')}</p>
      </div>
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={mutation.isPending}>
        <UploadIcon /> {t('settings.logo.upload')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) mutation.mutate(file)
        }}
      />
    </section>
  )
}

function SettingsForm({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      queryClient.setQueryData(adminKeys.settings, response.data)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Saving settings failed')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('settings.saveFailed')))
    },
  })

  const form = useForm({
    defaultValues: {
      company_name: settings.company_name,
      company_address: settings.company_address,
      company_city: settings.company_city,
      company_phone: settings.company_phone,
      company_email: settings.company_email,
      company_pib: settings.company_pib,
      company_mb: settings.company_mb,
      company_bank_account: settings.company_bank_account,
      company_website: settings.company_website,
      default_currency: String(settings.default_currency),
      default_markup_percent: settings.default_markup_percent.replace('.', ','),
      offer_note: settings.offer_note,
      invoice_note: settings.invoice_note,
    },
    validators: { onSubmit: settingsFormSchema(t) },
    onSubmit: ({ value }) =>
      mutation.mutate({
        ...value,
        default_currency: Number(value.default_currency),
        default_markup_percent: normalizeDecimal(value.default_markup_percent) ?? value.default_markup_percent,
      }),
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        logOnFail(() => form.handleSubmit(), 'Settings form submission failed')
      }}
      className="grid gap-5"
    >
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">{t('settings.company.title')}</h2>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <InputField form={form} name="company_name" label={t('settings.company.name')} />
          <InputField form={form} name="company_phone" type="phone" label={t('settings.company.phone')} />
          <InputField form={form} name="company_address" label={t('settings.company.address')} />
          <InputField form={form} name="company_city" label={t('settings.company.city')} />
          <InputField form={form} name="company_email" type="email" label={t('settings.company.email')} />
          <InputField form={form} name="company_website" label={t('settings.company.website')} />
          <InputField form={form} name="company_pib" label={t('settings.company.pib')} />
          <InputField form={form} name="company_mb" label={t('settings.company.mb')} />
          <InputField form={form} name="company_bank_account" label={t('settings.company.bankAccount')} className="sm:col-span-2" />
        </FieldGroup>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">{t('settings.defaults.title')}</h2>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <SelectField
            form={form}
            name="default_currency"
            label={t('settings.defaults.currency')}
            options={[Currency.EUR, Currency.RSD].map((currency) => ({ value: String(currency), label: t(`currency.${currency}`) }))}
          />
          <InputField form={form} name="default_markup_percent" label={t('settings.defaults.markup')} inputProps={{ inputMode: 'decimal' }} />
        </FieldGroup>
      </section>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold">{t('settings.notes.title')}</h2>
        <FieldGroup className="gap-4">
          <TextareaField form={form} name="offer_note" label={t('settings.notes.offer')} description={t('settings.notes.offerHint')} />
          <TextareaField form={form} name="invoice_note" label={t('settings.notes.invoice')} />
        </FieldGroup>
      </section>

      <div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}

function RatesCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [day, setDay] = useState(todayIso())
  const [rate, setRate] = useState('')

  const { data: rates } = useQuery({ queryKey: adminKeys.exchangeRates, queryFn: fetchExchangeRates })

  const mutation = useMutation({
    mutationFn: () => saveExchangeRate(day, normalizeDecimal(rate) ?? rate),
    onSuccess: (response) => {
      toast.success(response.message)
      setRate('')
      logOnFail(() => queryClient.invalidateQueries({ queryKey: adminKeys.exchangeRates }), 'Invalidate rates failed')
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Saving rate failed')
      toast.error(getApiErrorMessage(err, t('settings.rates.failed')))
    },
  })

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">{t('settings.rates.title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t('settings.rates.description')}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm">
          {t('settings.rates.date')}
          <Input type="date" value={day} onChange={(event) => setDay(event.target.value)} className="w-44" />
        </label>
        <label className="grid gap-1 text-sm">
          {t('settings.rates.rate')}
          <Input value={rate} onChange={(event) => setRate(event.target.value)} inputMode="decimal" placeholder="117,1234" className="w-36" />
        </label>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || normalizeDecimal(rate) === null}>
          {t('settings.rates.save')}
        </Button>
      </div>
      {rates && rates.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t('settings.rates.empty')}</p>}
      {rates && rates.length > 0 && (
        <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {rates.slice(0, 15).map((row) => (
            <li key={row.id} className="flex justify-between gap-3 rounded-md bg-muted/50 px-3 py-1.5 tabular-nums">
              <span>{formatDay(row.effective_at)}</span>
              <span>
                {formatRate(row.rate)} <span className="text-xs text-muted-foreground">({t(`settings.rates.source.${row.source}`)})</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
