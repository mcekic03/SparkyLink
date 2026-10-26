import { z } from 'zod'
import { userSchema } from '#/types/user'

export const sessionResponseSchema = z.object({
  message: z.string(),
  token: z.string().min(1),
  expires_in: z.number().nullable(),
  data: userSchema,
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>
