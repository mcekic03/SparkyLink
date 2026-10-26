import { Button } from '@app/ui/components/button'
import { getApiErrorMessage } from '#/lib/api-error'

type Props = {
  error: unknown
  title?: string
  onRetry?: () => void
}

export function QueryError({
  error,
  title = 'Failed to load',
  onRetry,
}: Props) {
  return (
    <div className="border-destructive/40 bg-destructive/5 rounded-md border p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {getApiErrorMessage(error, 'Something went wrong. Please try again.')}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
