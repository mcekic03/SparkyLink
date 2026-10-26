import { UserRole, userSchema } from '#/types/user'

// `UserRole` and `User` are defined in `#/types/user` because `lib/auth-store`
// needs them and `lib/` may not import from `features/*`. Re-exported here so
// feature code keeps its local import path.
export { UserRole, userSchema, parseStoredUser } from '#/types/user'
export type { User } from '#/types/user'

/** Numeric enums also carry reverse string keys, so filter down to the values. */
export const USER_ROLE_VALUES = Object.values(UserRole).filter(
  (value): value is UserRole => typeof value === 'number',
)

/**
 * Roles arrive as strings from `<select>` values and URL search params. This is
 * the one place that turns those back into the domain enum, rejecting anything
 * that isn't a real role.
 */
export function parseUserRole(
  value: string | number | undefined,
): UserRole | undefined {
  if (value === undefined || value === '') return undefined
  const result = userSchema.shape.role_id.safeParse(Number(value))
  return result.success ? result.data : undefined
}

/** Query parameters understood by the Laravel `filters()` scope. */
export interface UsersParams {
  page?: number
  search?: string
  role_id?: UserRole
}

export interface CreateUserPayload {
  name: string
  email: string
  role_id: UserRole
  password: string
  password_confirmation: string
}

export interface UpdateUserPayload {
  name: string
  email: string
  role_id: UserRole
  /** Omitted entirely when the user leaves the password fields blank. */
  password?: string
  password_confirmation?: string
}
