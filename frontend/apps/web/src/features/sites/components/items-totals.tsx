import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@app/ui/lib/utils'
import { DualAmount } from '#/components/dual-amount'
import { QueryError } from '#/components/query-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { fetchSiteSummary } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { itemTotalsFor } from '../lib/item-totals'
import type { ItemType, Site } from '../types'

interface Props {
  site: Site
  /** Filter kartice sa stavkama; bez njega sve stavke. */
  type: ItemType | undefined
  className?: string
}

/**
 * Tekući zbirovi iznad liste za izabranu vrstu stavki: koliko je do sada koštala i koliko
 * investitor duguje za nju. Koristi keširan obračun gradilišta, pa se osvežava posle
 * svake promene novca.
 */
export function ItemsTotals({ site, type, className }: Props) {
  const { t } = useTranslation()

  const { data, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.summary(site.id),
    queryFn: () => fetchSiteSummary(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch item totals')
  }, [isError, error])

  if (isError) {
    return (
      <QueryError
        error={error}
        title={t('items.totals.loadFailed')}
        onRetry={() => logOnFail(() => refetch(), 'Retry item totals failed')}
      />
    )
  }

  if (!data) return null

  return (
    <dl className={cn('flex flex-wrap justify-end gap-x-6 gap-y-2', className)}>
      {itemTotalsFor(data, type).map((total) => (
        <div key={total.key} className="flex flex-col items-end">
          <dt className="text-xs text-muted-foreground">{t(total.label)}</dt>
          <dd>
            <DualAmount pair={total.pair} primary={site.currency} className="items-end [&>span:first-child]:text-base [&>span:first-child]:font-semibold" />
          </dd>
        </div>
      ))}
    </dl>
  )
}
