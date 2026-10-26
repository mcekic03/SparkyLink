import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@app/ui/components/button'
import { cn } from '@app/ui/lib/utils'
import { formatAmount } from '#/lib/money'
import { Currency } from '#/types/money'
import type { Dashboard } from '../api/dashboard.api'

type Month = Dashboard['monthly'][number]

/** `2026-10` → `okt 26` in the active locale. */
function monthLabel(month: string, locale: string, style: 'short' | 'long' = 'short'): string {
  const [year, value] = month.split('-').map(Number)
  return new Date(year, value - 1, 1).toLocaleDateString(locale === 'sr' ? 'sr-Latn-RS' : 'en-GB', {
    month: style,
    year: style === 'short' ? '2-digit' : 'numeric',
  })
}

/**
 * Profit per month in euros: one series, so one hue and no legend (the title
 * names it). Losses go below the baseline. Hover or tap a bar for the month's
 * billed / costs / profit; a table view sits behind a toggle.
 */
export function MonthlyProfitChart({ months }: { months: Month[] }) {
  const { t, i18n } = useTranslation()
  const [active, setActive] = useState<number>(months.length - 1)
  const [asTable, setAsTable] = useState(false)

  const values = months.map((month) => Number(month.profit.eur))
  const maxUp = Math.max(0, ...values)
  const maxDown = Math.max(0, ...values.map((value) => -value))
  const range = maxUp + maxDown || 1
  const upShare = maxUp / range
  const current = months.at(active)

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t('dashboard.monthly.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('dashboard.monthly.description')}</p>
        </div>
        <Button size="xs" variant="outline" onClick={() => setAsTable((value) => !value)}>
          {asTable ? t('dashboard.monthly.title') : t('table.columns')}
        </Button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm tabular-nums">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-medium" />
                <th className="py-1 text-right font-medium">{t('dashboard.monthly.billed')}</th>
                <th className="py-1 text-right font-medium">{t('dashboard.monthly.costs')}</th>
                <th className="py-1 text-right font-medium">{t('dashboard.monthly.profit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {months.map((month) => (
                <tr key={month.month}>
                  <td className="py-1">{monthLabel(month.month, i18n.language, 'long')}</td>
                  <td className="py-1 text-right">{formatAmount(month.billed.eur, Currency.EUR)}</td>
                  <td className="py-1 text-right">{formatAmount(month.costs.eur, Currency.EUR)}</td>
                  <td className="py-1 text-right font-medium">{formatAmount(month.profit.eur, Currency.EUR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="relative h-44" role="img" aria-label={t('dashboard.monthly.title')}>
            {/* Recessive baseline at zero. */}
            <div className="absolute inset-x-0 border-t border-border" style={{ top: `${String(upShare * 100)}%` }} />
            <div className="absolute inset-0 flex items-stretch gap-[2px]">
              {months.map((month, index) => {
                const value = Number(month.profit.eur)
                const height = (Math.abs(value) / range) * 100
                return (
                  <button
                    key={month.month}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onClick={() => setActive(index)}
                    aria-label={`${monthLabel(month.month, i18n.language, 'long')}: ${formatAmount(value, Currency.EUR)}`}
                    className="group relative flex-1"
                  >
                    <span
                      className={cn(
                        'absolute left-1/2 w-[min(70%,28px)] -translate-x-1/2 bg-chart-1 transition-opacity',
                        value >= 0 ? 'rounded-t-[4px]' : 'rounded-b-[4px]',
                        index === active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                      )}
                      style={
                        value >= 0
                          ? { bottom: `${String((1 - upShare) * 100)}%`, height: `${String(height)}%` }
                          : { top: `${String(upShare * 100)}%`, height: `${String(height)}%` }
                      }
                    />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-1 flex gap-[2px] text-[0.65rem] text-muted-foreground">
            {months.map((month) => (
              <span key={month.month} className="flex-1 truncate text-center">
                {monthLabel(month.month, i18n.language).split(' ')[0]}
              </span>
            ))}
          </div>
          {current && (
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs tabular-nums sm:text-sm">
              <span className="font-medium">{monthLabel(current.month, i18n.language, 'long')}</span>
              {' · '}
              {t('dashboard.monthly.billed')}: {formatAmount(current.billed.eur, Currency.EUR)}
              {' · '}
              {t('dashboard.monthly.costs')}: {formatAmount(current.costs.eur, Currency.EUR)}
              {' · '}
              <span className="font-medium">
                {t('dashboard.monthly.profit')}: {formatAmount(current.profit.eur, Currency.EUR)}
              </span>
            </p>
          )}
        </>
      )}
    </section>
  )
}
