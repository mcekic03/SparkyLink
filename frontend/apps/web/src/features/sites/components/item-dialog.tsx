import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm, useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { FieldGroup } from '@app/ui/components/field'
import { DatePickerField, InputField, SelectField, SwitchField, TextareaField } from '@app/ui/components/fields'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, formatRate, normalizeDecimal } from '#/lib/money'
import { Currency, parseCurrency } from '#/types/money'
import { fetchSuggestions, saveItem } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useExchangeRate } from '../api/use-exchange-rate'
import { useInvalidateMoney } from '../api/use-site-mutation'
import { keepsPurchaseEstimate } from '../lib/purchase-estimate'
import { ItemType, parseItemType } from '../types'
import type { ItemSuggestion, Site, SiteItem } from '../types'
import { itemFormSchema } from '../validation/money-forms.schema'

interface Props {
  site: Site
  item?: SiteItem
  defaultType?: ItemType
  open: boolean
  onOpenChange: (open: boolean) => void
}

const comma = (value: string) => value.replace('.', ',')

/** `2.50` → `2,5` for an input; `0.00` → '' so the field reads as empty. */
function priceInput(value: string | undefined): string {
  if (!value || Number(value) === 0) return ''
  return comma(String(Number(value)))
}

function product(quantity: string, price: string): number {
  return Number(normalizeDecimal(quantity) ?? 0) * Number(normalizeDecimal(price) ?? 0)
}

export function ItemDialog({ site, item, defaultType = ItemType.Material, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [rateTouched, setRateTouched] = useState(item !== undefined)
  const markup = site.effective_markup_percent ?? '20'

  const typeOptions = [ItemType.Material, ItemType.Service, ItemType.Other].map((type) => ({
    value: String(type),
    label: t(`items.type.${type}`),
  }))
  const currencyOptions = [Currency.EUR, Currency.RSD].map((currency) => ({ value: String(currency), label: t(`currency.${currency}`) }))

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof saveItem>[1]) => saveItem(site.id, payload, item?.id),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save item')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) {
        toast.error(getApiErrorMessage(error, t('items.saveFailed')))
      }
    },
  })

  const form = useForm({
    defaultValues: {
      type: String(item?.type ?? defaultType),
      currency: String(item?.currency ?? site.currency),
      name: item?.name ?? '',
      unit: item?.unit ?? 'kom',
      quantity: item ? comma(String(Number(item.quantity))) : '1',
      // Procena nije plaćena cena, pa polje počinje prazno, za pravu nabavnu.
      purchase_price: item?.is_purchase_estimated ? '' : priceInput(item?.purchase_price),
      sale_price: priceInput(item?.sale_price),
      occurred_at: item?.occurred_at ?? todayIso(),
      exchange_rate: item ? comma(item.exchange_rate) : '',
      note: item?.note ?? '',
      is_billable: item?.is_billable ?? defaultType !== ItemType.Other,
    },
    validators: { onSubmit: itemFormSchema(t) },
    onSubmit: ({ value }) => {
      const type = parseItemType(value.type)
      const currency = parseCurrency(value.currency)
      if (type === undefined || currency === undefined) return
      const estimate = keepsPurchaseEstimate(item, type, value.purchase_price)

      mutation.mutate({
        type,
        currency,
        name: value.name.trim(),
        unit: value.unit.trim() || 'kom',
        quantity: normalizeDecimal(value.quantity) ?? value.quantity,
        is_purchase_estimated: estimate,
        purchase_price: type === ItemType.Service || estimate ? undefined : (normalizeDecimal(value.purchase_price) ?? undefined),
        sale_price: normalizeDecimal(value.sale_price) ?? undefined,
        occurred_at: value.occurred_at,
        exchange_rate: normalizeDecimal(value.exchange_rate) ?? undefined,
        note: value.note.trim() || undefined,
        is_billable: value.is_billable,
      })
    },
  })

  const day = useStore(form.store, (state) => state.values.occurred_at)
  const type = parseItemType(useStore(form.store, (state) => state.values.type)) ?? ItemType.Material
  const name = useStore(form.store, (state) => state.values.name)
  const values = useStore(form.store, (state) => state.values)
  const rateQuery = useExchangeRate(day)

  // The day's NBS rate fills the field until the user types their own.
  useEffect(() => {
    if (!rateTouched && rateQuery.data) form.setFieldValue('exchange_rate', comma(rateQuery.data))
  }, [rateQuery.data, rateTouched, form])

  // Suggestions from the price list and earlier items, after a short pause in typing.
  const [search, setSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearch(name.trim()), 300)
    return () => clearTimeout(timer)
  }, [name])

  const suggestions = useQuery({
    queryKey: sitesKeys.suggestions(search, type),
    queryFn: () => fetchSuggestions(search, type),
    enabled: !item && search.length >= 2,
    staleTime: 30_000,
  })

  const applySuggestion = (suggestion: ItemSuggestion) => {
    form.setFieldValue('name', suggestion.name)
    form.setFieldValue('unit', suggestion.unit)
    form.setFieldValue('currency', String(suggestion.currency))
    form.setFieldValue('purchase_price', priceInput(suggestion.purchase_price ?? undefined))
    form.setFieldValue('sale_price', priceInput(suggestion.sale_price ?? undefined))
    setSearch('')
  }

  const applyMarkup = () => {
    const purchase = Number(normalizeDecimal(values.purchase_price) ?? 0)
    // Bez nabavne cene marža bi obrisala cenu za investitora.
    if (!(purchase > 0)) return
    const sale = Math.round(purchase * (1 + Number(markup) / 100) * 100) / 100
    form.setFieldValue('sale_price', comma(String(sale)))
  }

  const currency = parseCurrency(values.currency) ?? site.currency
  const estimate = keepsPurchaseEstimate(item, type, values.purchase_price)
  const showSuggestions = !item && search.length >= 2 && (suggestions.data?.length ?? 0) > 0 && search === name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? t('items.edit') : t('items.create')}</DialogTitle>
          <DialogDescription>{site.name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Item form submission failed')
          }}
          className="space-y-4"
        >
          <FieldGroup className="grid grid-cols-2 gap-3">
            <SelectField form={form} name="type" label={t('items.form.type')} options={typeOptions} />
            <SelectField form={form} name="currency" label={t('items.form.currency')} options={currencyOptions} />
            <div className="col-span-2">
              <InputField form={form} name="name" label={t('items.form.name')} placeholder={t('items.form.namePlaceholder')} inputProps={{ autoComplete: 'off' }} />
              {showSuggestions && (
                <div className="mt-1 overflow-hidden rounded-md border bg-popover shadow-sm">
                  <p className="px-3 pt-2 text-xs text-muted-foreground">{t('items.form.suggestions')}</p>
                  {suggestions.data?.map((suggestion) => (
                    <button
                      key={`${suggestion.source}-${suggestion.name}`}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="min-w-0 truncate">{suggestion.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {suggestion.sale_price ? formatAmount(suggestion.sale_price, suggestion.currency) : ''} ·{' '}
                        {suggestion.source === 'price_list' ? t('items.form.fromPriceList') : t('items.form.fromHistory')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <InputField form={form} name="quantity" label={t('items.form.quantity')} inputProps={{ inputMode: 'decimal' }} />
            <InputField form={form} name="unit" label={t('items.form.unit')} />
            {type !== ItemType.Service && (
              <InputField
                form={form}
                name="purchase_price"
                label={t('items.form.purchasePrice')}
                description={estimate ? t('items.form.purchaseEstimatedHint') : t('items.form.purchasePriceHint')}
                inputProps={{ inputMode: 'decimal' }}
                className="col-span-2 sm:col-span-1"
              />
            )}
            <div className={type === ItemType.Service ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <InputField
                form={form}
                name="sale_price"
                label={t('items.form.salePrice')}
                description={type === ItemType.Service ? undefined : t('items.form.salePriceHint', { markup })}
                inputProps={{ inputMode: 'decimal' }}
              />
              {type !== ItemType.Service && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-foreground underline decoration-primary decoration-2"
                  onClick={applyMarkup}
                >
                  {t('items.form.applyMarkup')}
                </Button>
              )}
            </div>
            <DatePickerField form={form} name="occurred_at" label={t('items.form.date')} />
            <InputField
              form={form}
              name="exchange_rate"
              label={t('items.form.rate')}
              description={rateQuery.isError && !values.exchange_rate ? t('items.form.rateMissing') : t('items.form.rateHint')}
              inputProps={{ inputMode: 'decimal', onInput: () => setRateTouched(true) }}
            />
            <SwitchField form={form} name="is_billable" label={t('items.form.billable')} className="col-span-2" />
            <TextareaField form={form} name="note" label={t('items.form.note')} className="col-span-2" />
          </FieldGroup>

          <p className="rounded-md bg-muted px-3 py-2 text-sm tabular-nums">
            {t('items.form.lineTotal', {
              purchase: formatAmount(
                type === ItemType.Service ? 0 : product(values.quantity, estimate ? values.sale_price : values.purchase_price),
                currency,
              ),
              sale: formatAmount(product(values.quantity, values.sale_price), currency),
            })}
            {values.exchange_rate && (
              <span className="block text-xs text-muted-foreground">1 € = {formatRate(normalizeDecimal(values.exchange_rate) ?? 0)} din</span>
            )}
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
