import { cn } from '@app/ui/lib/utils'
import { formatAmount } from '#/lib/money'
import { Currency, otherCurrency, pairValue } from '#/types/money'
import type { MoneyPair } from '#/types/money'

interface DualAmountProps {
  pair: MoneyPair
  /** The currency shown large; the other one goes underneath. */
  primary?: Currency
  className?: string
  /** Colours negative amounts (a loss) red. */
  signed?: boolean
}

/** Both currencies everywhere: the primary one large, the other small below. */
export function DualAmount({
  pair,
  primary = Currency.EUR,
  className,
  signed = false,
}: DualAmountProps) {
  const main = pairValue(pair, primary)
  const secondary = otherCurrency(primary)
  const negative = signed && Number(main) < 0

  return (
    <span className={cn('inline-flex flex-col leading-tight tabular-nums', className)}>
      <span className={cn('font-medium', negative && 'text-destructive')}>
        {formatAmount(main, primary)}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatAmount(pairValue(pair, secondary), secondary)}
      </span>
    </span>
  )
}
