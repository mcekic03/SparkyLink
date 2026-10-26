import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@app/ui/lib/utils'
import { DualAmount } from '#/components/dual-amount'
import { QueryError } from '#/components/query-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, formatQuantity, formatRate, isNegative } from '#/lib/money'
import { otherCurrency } from '#/types/money'
import type { MoneyPair } from '#/types/money'
import { fetchSiteSummary } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import type { Site } from '../types'

export function SummaryPanel({ site }: { site: Site }) {
  const { t } = useTranslation()

  const { data, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.summary(site.id),
    queryFn: () => fetchSiteSummary(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch site summary')
  }, [isError, error])

  if (isError) {
    return (
      <QueryError
        error={error}
        title={t('summary.loadFailed')}
        onRetry={() => logOnFail(() => refetch(), 'Retry fetching summary failed')}
      />
    )
  }

  if (!data) {
    return <div className="h-28 animate-pulse rounded-lg border bg-muted/40" />
  }

  const currency = site.currency
  const other = otherCurrency(currency)
  const overpaid = isNegative(data.balance.amount)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={t('summary.billed')} pair={data.billed} currency={currency} />
        <Kpi label={t('summary.costs')} pair={data.costs} currency={currency} />
        <Kpi label={t('summary.profit')} pair={data.profit} currency={currency} signed />
        <Kpi label={t('summary.paid')} pair={data.paid} currency={currency} />
        <div className="col-span-2 rounded-lg border-2 border-primary bg-primary/10 p-3 lg:col-span-1 dark:bg-primary/5">
          <p className="text-xs font-medium text-muted-foreground">
            {overpaid ? t('summary.overpaid') : t('summary.balance')}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatAmount(overpaid ? data.balance.amount.replace('-', '') : data.balance.amount, currency)}
          </p>
          {data.balance.other_amount !== null && (
            <p className="text-xs text-muted-foreground tabular-nums">
              ≈ {formatAmount(data.balance.other_amount.replace('-', ''), other)}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium" />
              <th className="px-3 py-2 text-right font-medium">{t('summary.purchase')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('summary.sale')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('summary.profit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <Row label={t('summary.materials')} currency={currency} purchase={data.materials.purchase} sale={data.materials.sale} profit={data.materials.margin} />
            <Row label={t('summary.services')} currency={currency} sale={data.services.sale} profit={data.services.sale} />
            <Row label={t('summary.other')} currency={currency} purchase={data.other.purchase} sale={data.other.sale} />
            <Row
              label={t('summary.labor')}
              hint={t('summary.personHours', { hours: formatQuantity(data.labor.person_hours) })}
              currency={currency}
              purchase={data.labor.cost}
            />
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {data.exchange_rate_today
          ? t('summary.rateToday', { rate: formatRate(data.exchange_rate_today) })
          : t('summary.noRate')}
      </p>
    </div>
  )
}

function Kpi({ label, pair, currency, signed = false }: { label: string; pair: MoneyPair; currency: Site['currency']; signed?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <DualAmount pair={pair} primary={currency} signed={signed} className="mt-1 [&>span:first-child]:text-lg" />
    </div>
  )
}

function Row({
  label,
  hint,
  currency,
  purchase,
  sale,
  profit,
}: {
  label: string
  hint?: string
  currency: Site['currency']
  purchase?: MoneyPair
  sale?: MoneyPair
  profit?: MoneyPair
}) {
  const cell = (pair: MoneyPair | undefined, signed = false) =>
    pair ? <DualAmount pair={pair} primary={currency} signed={signed} className={cn('items-end')} /> : <span className="text-muted-foreground">—</span>

  return (
    <tr>
      <td className="px-3 py-2">
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </td>
      <td className="px-3 py-2 text-right">{cell(purchase)}</td>
      <td className="px-3 py-2 text-right">{cell(sale)}</td>
      <td className="px-3 py-2 text-right">{cell(profit, true)}</td>
    </tr>
  )
}
