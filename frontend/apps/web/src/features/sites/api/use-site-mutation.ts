import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getApiErrorMessage } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { MONEY_DEPENDENT_KEYS } from '#/lib/query-keys'

/** Refreshes the site (summary, tabs), the site list and the dashboard after a money change. */
export function useInvalidateMoney() {
  const queryClient = useQueryClient()

  return () => {
    for (const key of MONEY_DEPENDENT_KEYS) {
      logOnFail(() => queryClient.invalidateQueries({ queryKey: key }), 'Invalidate after money change failed')
    }
  }
}

/**
 * A delete with the house conventions: the API message as a toast, a logged and
 * toasted failure, and everything that shows money refreshed.
 */
export function useDeleteMutation<TId>(
  mutationFn: (id: TId) => Promise<{ message: string }>,
  failedMessage: string,
) {
  const invalidate = useInvalidateMoney()

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Delete failed')
      toast.error(getApiErrorMessage(err, failedMessage))
    },
  })
}
