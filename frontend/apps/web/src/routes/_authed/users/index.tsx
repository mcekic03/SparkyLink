import { createFileRoute } from '@tanstack/react-router'
import { UserRole } from '#/types/user'
import z from 'zod'
import { UsersPage } from '#/features/users/pages/users.page'

/**
 * Every field `.catch`es to undefined so a hand-typed or stale URL degrades to
 * defaults instead of throwing out of `validateSearch` and taking the route down.
 */
const usersSearchSchema = z.object({
  page: z.coerce.number().int().positive().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  role_id: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_authed/users/')({
  validateSearch: usersSearchSchema,
  component: UsersPage,
  staticData: { roles: [UserRole.SuperAdmin] },
})
