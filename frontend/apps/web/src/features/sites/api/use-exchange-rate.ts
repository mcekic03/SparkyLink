import { useQuery } from '@tanstack/react-query'
import { fetchExchangeRate } from './sites.api'
import { sitesKeys } from './sites.keys'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * NBS middle rate for the day a money form is about. A failed lookup (the
 * service is down and there is no recent rate) leaves the field for the user.
 */
export function useExchangeRate(day: string) {
  return useQuery({
    queryKey: sitesKeys.exchangeRate(day),
    queryFn: () => fetchExchangeRate(day),
    enabled: ISO_DAY.test(day),
    staleTime: 60 * 60 * 1000,
    retry: false,
  })
}
