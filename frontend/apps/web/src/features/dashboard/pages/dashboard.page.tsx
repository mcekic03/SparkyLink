import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Button } from '@app/ui/components/button'
import { Input } from '@app/ui/components/input'
import { DualAmount } from '#/components/dual-amount'
import { PageHeader } from '#/components/page-header'
import { QueryError } from '#/components/query-error'
import { todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount, formatRate } from '#/lib/money'
import { adminKeys } from '#/lib/query-keys'
import { Currency } from '#/types/money'
import type { MoneyPair } from '#/types/money'
import { fetchDashboard } from '../api/dashboard.api'
import { MonthlyProfitChart } from '../components/monthly-profit-chart'

const routeApi = getRouteApi('/_authed/dashboard')

function presets(): Array<{ key: 'thisMonth' | 'thisYear' | 'lastYear'; from: string; to: string }> {
  const today = todayIso()
  const year = Number(today.slice(0, 4))
  return [
    { key: 'thisMonth', from: `${today.slice(0, 7)}-01`, to: today },
    { key: 'thisYear', from: `${String(year)}-01-01`, to: today },
    { key: 'lastYear', from: `${String(year - 1)}-01-01`, to: `${String(year - 1)}-12-31` },
  ]
}

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = routeApi.useSearch()
  const params = { from: search.from, to: search.to }

  const { data, isError, error, refetch } = useQuery({
    queryKey: [...adminKeys.dashboard, params],
    queryFn: () => fetchDashboard(params),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch dashboard')
  }, [isError, error])

  const setPeriod = (from?: string, to?: string) =>
    logOnFail(() => navigate({ to: '/dashboard', search: { from, to }, replace: true }), 'Dashboard period change failed')

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />

      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          {t('dashboard.from')}
          <Input type="date" value={data?.period.from ?? search.from ?? ''} onChange={(event) => setPeriod(event.target.value || undefined, search.to)} className="w-40" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          {t('dashboard.to')}
          <Input type="date" value={data?.period.to ?? search.to ?? ''} onChange={(event) => setPeriod(search.from, event.target.value || undefined)} className="w-40" />
        </label>
        {presets().map((preset) => (
          <Button key={preset.key} size="sm" variant="outline" onClick={() => setPeriod(preset.from, preset.to)}>
            {t(`dashboard.${preset.key}`)}
          </Button>
        ))}
      </div>

      {isError && <QueryError error={error} title={t('dashboard.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry dashboard failed')} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tile label={t('dashboard.kpi.billed')} pair={data.totals.billed} />
            <Tile label={t('dashboard.kpi.costs')} pair={data.totals.costs} />
            <Tile label={t('dashboard.kpi.profit')} pair={data.totals.profit} signed />
            <Tile label={t('dashboard.kpi.paid')} pair={data.totals.paid} />
            <div className="col-span-2 rounded-lg border-2 border-primary bg-primary/10 p-3 lg:col-span-1 dark:bg-primary/5">
              <p className="text-xs font-medium text-muted-foreground">{t('dashboard.kpi.receivables')}</p>
              <DualAmount pair={{ eur: data.receivables.eur, rsd: data.receivables.rsd }} className="mt-1 [&>span:first-child]:text-xl" />
              <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.kpi.receivablesHint', { count: data.receivables.sites_count })}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['1', '2', '3'] as const).map((status) => (
              <Link
                key={status}
                to="/gradilista"
                search={{ status }}
                className="rounded-lg border bg-card p-3 hover:bg-accent/50"
              >
                <p className="text-2xl font-semibold tabular-nums">{data.sites_by_status[status] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t(`dashboard.sites.${status === '1' ? 'offer' : status === '2' ? 'open' : 'closed'}`)}</p>
              </Link>
            ))}
          </div>

          <MonthlyProfitChart months={data.monthly} />

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t('dashboard.debtors.title')}</h2>
              {data.debtors.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.debtors.empty')}</p>
              ) : (
                <ul className="divide-y">
                  {data.debtors.map((debtor) => (
                    <li key={debtor.id} className="flex items-center justify-between gap-3 py-2">
                      <Link to="/gradilista/$siteId" params={{ siteId: String(debtor.id) }} search={{ tab: 'payments' }} className="min-w-0 hover:underline">
                        <span className="block truncate font-medium">{debtor.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {debtor.investor_name ?? ''} · {t(`sites.paymentStatus.${debtor.payment_status}`)}
                        </span>
                      </Link>
                      <span className="shrink-0 font-medium tabular-nums">{formatAmount(debtor.balance, debtor.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t('dashboard.topSites.title')}</h2>
              {data.top_sites.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.topSites.empty')}</p>
              ) : (
                <ul className="divide-y">
                  {data.top_sites.map((site) => (
                    <li key={site.site_id} className="flex items-center justify-between gap-3 py-2">
                      <Link to="/gradilista/$siteId" params={{ siteId: String(site.site_id) }} className="min-w-0 truncate font-medium hover:underline">
                        {site.name}
                      </Link>
                      <DualAmount pair={site.profit} signed className="shrink-0 items-end" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {data.exchange_rate_today && (
            <p className="text-xs text-muted-foreground">{t('dashboard.rateToday', { rate: formatRate(data.exchange_rate_today) })}</p>
          )}
        </>
      )}
    </div>
  )
}

function Tile({ label, pair, signed = false }: { label: string; pair: MoneyPair; signed?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <DualAmount pair={pair} primary={Currency.EUR} signed={signed} className="mt-1 [&>span:first-child]:text-xl" />
    </div>
  )
}
