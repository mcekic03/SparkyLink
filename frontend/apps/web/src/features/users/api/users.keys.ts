import type { UsersParams } from '../types'

/**
 * Every query key for this domain, in one place.
 *
 * Inline arrays meant two files had to spell the same key identically for an
 * invalidation to land — and a mismatch fails silently, leaving stale data on
 * screen with nothing to debug.
 *
 * The keys nest, so `invalidateQueries({ queryKey: usersKeys.all })` reaches
 * every list and detail below it.
 */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: UsersParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
}
