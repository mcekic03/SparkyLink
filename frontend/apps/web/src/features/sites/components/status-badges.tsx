import { useTranslation } from 'react-i18next'
import { Badge } from '@app/ui/components/badge'
import { cn } from '@app/ui/lib/utils'
import { PaymentStatus, SiteStatus } from '../types'

const SITE_STATUS_CLASS: Record<SiteStatus, string> = {
  [SiteStatus.Offer]: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  [SiteStatus.Open]: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
  [SiteStatus.Closed]: 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
}

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  [PaymentStatus.PartiallyPaid]: 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
  [PaymentStatus.Paid]: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
}

export function SiteStatusBadge({ status, className }: { status: SiteStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className={cn(SITE_STATUS_CLASS[status], className)}>
      {t(`sites.status.${status}`)}
    </Badge>
  )
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className={cn(PAYMENT_STATUS_CLASS[status], className)}>
      {t(`sites.paymentStatus.${status}`)}
    </Badge>
  )
}
