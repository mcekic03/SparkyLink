import { z } from 'zod'

/** Mirrors `App\Enums\Role`: sistem ima jedan nalog, vlasnika. */
export enum UserRole {
  SuperAdmin = 1,
}

/** Unknown keys are stripped, so a new backend field cannot break a session. */
export const userSchema = z.object({
  id: z.number(),
  role_id: z.enum(UserRole),
  name: z.string(),
  email: z.string(),
  created_at: z.string(),
})

export type User = z.infer<typeof userSchema>

/** Returns null rather than throwing — a shape change signs the user out. */
export function parseStoredUser(value: unknown): User | null {
  const result = userSchema.safeParse(value)
  return result.success ? result.data : null
}
