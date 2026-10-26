import { z } from 'zod'
import { paginationSchema } from '#/types/api'
import { userSchema } from '#/types/user'

export const userResponseSchema = z.object({
  data: userSchema,
})

export const usersResponseSchema = z.object({
  data: z.array(userSchema),
  pagination: paginationSchema,
})

export const messageResponseSchema = z.object({
  message: z.string(),
})
