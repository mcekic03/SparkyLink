import { useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { logOnFail } from '#/lib/log-on-fail'
import type { FilterConfig, ParsedFilterState } from '../types'

type SearchParams = Record<string, unknown>
type SearchUpdater = SearchParams | ((prev: SearchParams) => SearchParams)

const SYSTEM_KEYS = new Set(['search', 'page'])

// Stable identity: a `filters = []` default parameter allocates a new array on
// every render, invalidating every memo and callback that depends on it.
const NO_FILTERS: FilterConfig[] = []

export function useDataTableFilters({
  search,
  filters = NO_FILTERS,
}: {
  search: Record<string, string | number | undefined>
  filters?: FilterConfig[]
}) {
  const navigate = useNavigate()

  const applySearch = useCallback(
    (update: SearchUpdater) => {
      logOnFail(
        () => navigate({ to: '.', search: update, replace: true }),
        'Data table URL update failed',
      )
    },
    [navigate],
  )

  const filterState: ParsedFilterState = useMemo(() => {
    const multiSelect: Record<string, string[]> = {}
    const filtersRecord: Record<string, string> = {}

    // Parse multi-select filters (for auto-generated sidebar)
    for (const filter of filters) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- guard for future filter types
      if (filter.type === 'multi-select') {
        const raw = search[filter.columnId]
        multiSelect[filter.columnId] =
          typeof raw === 'string' && raw ? raw.split(',') : []
      }
    }

    // Parse all non-system URL params into a flat record (for custom filter forms)
    for (const [key, value] of Object.entries(search)) {
      if (!SYSTEM_KEYS.has(key) && value !== undefined) {
        filtersRecord[key] = String(value)
      }
    }

    return {
      search: typeof search.search === 'string' ? search.search : '',
      page: typeof search.page === 'number' ? search.page : 1,
      filters: filtersRecord,
      multiSelect,
    }
  }, [search, filters])

  const setSearch = useCallback(
    (value: string) => {
      applySearch((prev) => {
        const next = { ...prev }
        if (value) {
          next.search = value
        } else {
          delete next.search
        }
        delete next.page
        return next
      })
    },
    [applySearch],
  )

  const setPage = useCallback(
    (page: number) => {
      applySearch((prev) => {
        const next = { ...prev }
        if (page > 1) {
          next.page = page
        } else {
          delete next.page
        }
        return next
      })
    },
    [applySearch],
  )

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      applySearch((prev) => {
        const next = { ...prev }
        if (value !== undefined && value !== '') {
          next[key] = value
        } else {
          delete next[key]
        }
        delete next.page
        return next
      })
    },
    [applySearch],
  )

  const toggleFilterValue = useCallback(
    (columnId: string, value: string) => {
      const filterConfig = filters.find((f) => f.columnId === columnId)
      const isSingle = filterConfig?.mode === 'single'

      applySearch((prev) => {
        const next = { ...prev }

        if (isSingle) {
          if (next[columnId] === value) {
            delete next[columnId]
          } else {
            next[columnId] = value
          }
        } else {
          const raw = typeof next[columnId] === 'string' ? next[columnId] : ''
          const current = raw ? raw.split(',') : []
          const index = current.indexOf(value)

          if (index >= 0) {
            current.splice(index, 1)
          } else {
            current.push(value)
          }

          if (current.length > 0) {
            next[columnId] = current.join(',')
          } else {
            delete next[columnId]
          }
        }

        delete next.page
        return next
      })
    },
    [applySearch, filters],
  )

  const clearAllFilters = useCallback(() => {
    applySearch({})
  }, [applySearch])

  const hasActiveFilters = useMemo(() => {
    if (filterState.search) return true
    if (Object.keys(filterState.filters).length > 0) return true
    return Object.values(filterState.multiSelect).some((v) => v.length > 0)
  }, [filterState])

  return {
    filterState,
    setSearch,
    setPage,
    setFilter,
    toggleFilterValue,
    clearAllFilters,
    hasActiveFilters,
  }
}
