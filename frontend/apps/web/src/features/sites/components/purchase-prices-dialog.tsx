import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { InputField, RadioGroupField, SelectField } from '@app/ui/components/fields'
import { getApiErrorMessage } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { formatAmount, isNonNegativeDecimal, normalizeDecimal } from '#/lib/money'
import { Currency, otherCurrency, pairValue, parseCurrency } from '#/types/money'
import { setPurchasePrices } from '../api/sites.api'
import { useInvalidateMoney } from '../api/use-site-mutation'
import { paidPercentLower, selectionSums } from '../lib/item-selection'
import type { PurchasePricesPayload, Site, SiteItem } from '../types'

type Mode = 'percent' | 'total'

interface Props {
  site: Site
  items: SiteItem[]
  ids: ReadonlySet<number>
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Posle upisa: zatvoriti prozor i poništiti izbor. */
  onDone: () => void
}

const percentText = (value: number) => Math.abs(value).toLocaleString('sr-Latn-RS', { maximumFractionDigits: 2 })

/**
 * Nabavna cena za više stavki odjednom: manja za procenat od cene za investitora, ili tako
 * da zbir bude koliko je plaćeno. Raspodelu računa backend; ovde je samo pregled.
 */
export function PurchasePricesDialog({ site, items, ids, open, onOpenChange, onDone }: Props) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  // Obično se zna koliko je plaćeno u prodavnici, pa je to prvi izbor.
  const [mode, setMode] = useState<Mode>('total')
  const [percent, setPercent] = useState('')
  const [total, setTotal] = useState('')
  const [currency, setCurrency] = useState<Currency>(site.currency)

  const sums = selectionSums(items, ids)
  const other = otherCurrency(site.currency)

  const mutation = useMutation({
    mutationFn: (payload: PurchasePricesPayload) => setPurchasePrices(site.id, payload),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
      onDone()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Setting purchase prices failed')
      toast.error(getApiErrorMessage(err, t('items.purchase.failed')))
    },
  })

  const percentValue = normalizeDecimal(percent)
  const percentValid = percentValue !== null && Number(percentValue) >= 0 && Number(percentValue) <= 100
  const totalValid = isNonNegativeDecimal(total)
  const lower = paidPercentLower(total, pairValue(sums.sale, currency))

  const submit = () => {
    const itemIds = [...ids]
    mutation.mutate(
      mode === 'percent'
        ? { item_ids: itemIds, percent: percentValue ?? '0' }
        : { item_ids: itemIds, total: normalizeDecimal(total) ?? '0', currency },
    )
  }

  const totalPreview = () => {
    if (lower === null) return undefined
    return lower < 0 ? t('items.purchase.totalPreviewHigher', { percent: percentText(lower) }) : t('items.purchase.totalPreview', { percent: percentText(lower) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('items.purchase.title')}</DialogTitle>
          <DialogDescription>{t('items.purchase.description', { count: sums.count })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted px-3 py-2 text-sm tabular-nums">
            <p>
              {t('items.purchase.sale')}: <strong>{formatAmount(pairValue(sums.sale, site.currency), site.currency)}</strong>{' '}
              <span className="text-muted-foreground">({formatAmount(pairValue(sums.sale, other), other)})</span>
            </p>
            <p className="text-muted-foreground">
              {t('items.purchase.current')}: {formatAmount(pairValue(sums.purchase, site.currency), site.currency)}
            </p>
          </div>

          <RadioGroupField
            label={t('items.purchase.mode')}
            value={mode}
            onChange={(value) => setMode(value === 'percent' ? 'percent' : 'total')}
            options={[
              { value: 'total', label: t('items.purchase.byTotal') },
              { value: 'percent', label: t('items.purchase.byPercent') },
            ]}
          />

          {mode === 'percent' ? (
            <InputField
              label={t('items.purchase.percent')}
              value={percent}
              onChange={setPercent}
              inputProps={{ inputMode: 'decimal' }}
              description={
                percentValid
                  ? t('items.purchase.percentPreview', {
                      total: formatAmount(Number(pairValue(sums.sale, site.currency)) * (1 - Number(percentValue) / 100), site.currency),
                    })
                  : undefined
              }
              error={percent.trim() !== '' && !percentValid ? t('items.purchase.percentInvalid') : undefined}
            />
          ) : (
            <div className="grid grid-cols-[1fr_8rem] items-start gap-3">
              <InputField
                label={t('items.purchase.total')}
                value={total}
                onChange={setTotal}
                inputProps={{ inputMode: 'decimal' }}
                description={totalPreview()}
                error={total.trim() !== '' && !totalValid ? t('items.purchase.totalInvalid') : undefined}
              />
              <SelectField
                label={t('items.purchase.currency')}
                value={String(currency)}
                onChange={(value) => setCurrency(parseCurrency(value) ?? site.currency)}
                options={[Currency.EUR, Currency.RSD].map((option) => ({ value: String(option), label: t(`currency.${option}`) }))}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t('items.purchase.note')}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit} disabled={(mode === 'percent' ? !percentValid : !totalValid) || mutation.isPending}>
            {mutation.isPending ? t('common.saving') : t('items.purchase.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
