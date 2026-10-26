import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@app/ui/components/button'
import { FieldGroup } from '@app/ui/components/field'
import {
  DatePickerField,
  InputField,
  SelectField,
  TextareaField,
} from '@app/ui/components/fields'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { normalizeDecimal } from '#/lib/money'
import { MONEY_DEPENDENT_KEYS } from '#/lib/query-keys'
import { Currency, parseCurrency } from '#/types/money'
import { createSite, fetchSite, fetchSiteDefaults, updateSite } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { SiteStatus, parseSiteStatus } from '../types'
import type { Site, SitePayload } from '../types'
import { siteFormSchema } from '../validation/site-form.schema'
import type { SiteFormValues } from '../validation/site-form.schema'

interface Props {
  /** Absent when creating a new site. */
  siteId?: number
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function toFormValues(site: Site | undefined, defaultCurrency: Currency): SiteFormValues {
  return {
    name: site?.name ?? '',
    status: String(site?.status ?? SiteStatus.Open),
    currency: String(site?.currency ?? defaultCurrency),
    address: site?.address ?? '',
    city: site?.city ?? '',
    investor_name: site?.investor_name ?? '',
    investor_phone: site?.investor_phone ?? '',
    investor_email: site?.investor_email ?? '',
    investor_address: site?.investor_address ?? '',
    description: site?.description ?? '',
    markup_percent: site?.markup_percent ? site.markup_percent.replace('.', ',') : '',
    started_at: site?.started_at ?? '',
    completed_at: site?.completed_at ?? '',
  }
}

export function SiteFormPage({ siteId }: Props) {
  const { t } = useTranslation()

  const siteQuery = useQuery({
    queryKey: sitesKeys.detail(siteId ?? 0),
    queryFn: () => fetchSite(siteId ?? 0),
    enabled: siteId !== undefined,
  })

  const defaultsQuery = useQuery({
    queryKey: [...sitesKeys.all, 'defaults'],
    queryFn: fetchSiteDefaults,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (siteQuery.isError) logger.error({ err: siteQuery.error }, 'Failed to fetch site for editing')
  }, [siteQuery.isError, siteQuery.error])

  if (siteQuery.isError) {
    return (
      <QueryError
        error={siteQuery.error}
        title={t('sites.detail.loadFailed')}
        onRetry={() => logOnFail(() => siteQuery.refetch(), 'Retry fetching site failed')}
      />
    )
  }

  if ((siteId !== undefined && !siteQuery.data) || defaultsQuery.isPending) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
  }

  return (
    <SiteForm
      site={siteQuery.data}
      defaultCurrency={parseCurrency(defaultsQuery.data?.default_currency) ?? Currency.EUR}
      defaultMarkup={defaultsQuery.data?.default_markup_percent ?? '20'}
    />
  )
}

function SiteForm({ site, defaultCurrency, defaultMarkup }: { site?: Site; defaultCurrency: Currency; defaultMarkup: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const statusOptions = [SiteStatus.Offer, SiteStatus.Open, SiteStatus.Closed].map((status) => ({
    value: String(status),
    label: t(`sites.status.${status}`),
  }))
  const currencyOptions = [Currency.EUR, Currency.RSD].map((currency) => ({
    value: String(currency),
    label: t(`currency.${currency}`),
  }))

  const mutation = useMutation({
    mutationFn: (payload: SitePayload) => (site ? updateSite(site.id, payload) : createSite(payload)),
    onSuccess: async (response) => {
      if (response.message) toast.success(response.message)
      for (const key of MONEY_DEPENDENT_KEYS) {
        logOnFail(() => queryClient.invalidateQueries({ queryKey: key }), 'Invalidate after site save failed')
      }
      await navigate({ to: '/gradilista/$siteId', params: { siteId: String(response.data.id) } })
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save site')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) {
        toast.error(getApiErrorMessage(error, site ? t('sites.edit.failed') : t('sites.create.failed')))
      }
    },
  })

  const form = useForm({
    defaultValues: toFormValues(site, defaultCurrency),
    validators: { onSubmit: siteFormSchema(t) },
    onSubmit: ({ value }) => {
      const status = parseSiteStatus(value.status)
      const currency = parseCurrency(value.currency)
      if (status === undefined || currency === undefined) return

      mutation.mutate({
        status,
        currency,
        name: value.name.trim(),
        address: emptyToNull(value.address),
        city: emptyToNull(value.city),
        investor_name: emptyToNull(value.investor_name),
        investor_phone: emptyToNull(value.investor_phone),
        investor_email: emptyToNull(value.investor_email),
        investor_address: emptyToNull(value.investor_address),
        description: emptyToNull(value.description),
        markup_percent: value.markup_percent.trim() === '' ? null : normalizeDecimal(value.markup_percent),
        started_at: emptyToNull(value.started_at),
        completed_at: emptyToNull(value.completed_at),
      })
    },
  })

  return (
    <div className="min-w-0">
      <PageHeader
        title={site ? t('sites.edit.title') : t('sites.create.title')}
        description={site ? site.name : t('sites.create.description')}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          logOnFail(() => form.handleSubmit(), 'Site form submission failed')
        }}
        className="grid max-w-4xl gap-5"
      >
        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{t('sites.form.sectionSite')}</h2>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <InputField form={form} name="name" label={t('sites.form.name')} placeholder={t('sites.form.namePlaceholder')} className="sm:col-span-2" />
            <SelectField form={form} name="status" label={t('sites.form.status')} options={statusOptions} />
            <InputField form={form} name="city" label={t('sites.form.city')} />
            <InputField form={form} name="address" label={t('sites.form.address')} className="sm:col-span-2" />
            <DatePickerField form={form} name="started_at" label={t('sites.form.startedAt')} />
            <DatePickerField form={form} name="completed_at" label={t('sites.form.completedAt')} />
            <TextareaField form={form} name="description" label={t('sites.form.description')} className="sm:col-span-2" />
          </FieldGroup>
        </section>

        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{t('sites.form.sectionInvestor')}</h2>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <InputField form={form} name="investor_name" label={t('sites.form.investorName')} />
            <InputField form={form} name="investor_phone" type="phone" label={t('sites.form.investorPhone')} />
            <InputField form={form} name="investor_email" type="email" label={t('sites.form.investorEmail')} />
            <InputField form={form} name="investor_address" label={t('sites.form.investorAddress')} />
          </FieldGroup>
        </section>

        <section className="rounded-lg border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold">{t('sites.form.sectionMoney')}</h2>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <SelectField form={form} name="currency" label={t('sites.form.currency')} description={t('sites.form.currencyHint')} options={currencyOptions} />
            <InputField
              form={form}
              name="markup_percent"
              label={t('sites.form.markup')}
              description={t('sites.form.markupHint', { value: defaultMarkup })}
              inputProps={{ inputMode: 'decimal' }}
            />
          </FieldGroup>
        </section>

        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('sites.create.submit')}
          </Button>
          <Button type="button" variant="outline" onClick={() => logOnFail(() => navigate({ to: site ? '/gradilista/$siteId' : '/gradilista', params: { siteId: String(site?.id ?? '') } }), 'Cancel navigation failed')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  )
}
