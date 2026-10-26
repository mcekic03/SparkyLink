import type { UserRole } from '#/types/user'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Roles allowed here. Absent means any signed-in user. */
    roles?: ReadonlyArray<UserRole>
  }
}

export type AccessResult = 'allowed' | 'unauthenticated' | 'forbidden'

/** Only the parts of a route match this needs, so tests need no router. */
interface MatchLike {
  staticData?: { roles?: ReadonlyArray<UserRole> }
}

/**
 * Every role restriction on the matched chain. A parent's restriction still
 * applies to its children, so these intersect rather than override.
 */
export function requiredRolesFor(
  matches: ReadonlyArray<MatchLike>,
): ReadonlyArray<ReadonlyArray<UserRole>> {
  return matches
    .map((match) => match.staticData?.roles)
    .filter((roles): roles is ReadonlyArray<UserRole> => roles !== undefined)
}

export interface RouteMatcher {
  matchRoutes: (pathname: string) => ReadonlyArray<MatchLike>
}

/**
 * Resolves a path against the route tree and runs the same check `_authed`'s
 * `beforeLoad` runs — so navigation carries no roles of its own to drift.
 */
export function canAccessPath(
  router: RouteMatcher,
  role: UserRole | null,
  pathname: string,
): boolean {
  const matches = router.matchRoutes(pathname)
  return checkAccess(role, requiredRolesFor(matches)) === 'allowed'
}

export function checkAccess(
  role: UserRole | null,
  restrictions: ReadonlyArray<ReadonlyArray<UserRole>>,
): AccessResult {
  if (role === null) return 'unauthenticated'

  // Fails closed: an empty `roles: []` allows nobody, rather than everybody.
  const permitted = restrictions.every((allowed) => allowed.includes(role))
  return permitted ? 'allowed' : 'forbidden'
}
