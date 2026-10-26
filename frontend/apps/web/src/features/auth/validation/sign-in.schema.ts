import z from 'zod'

export const signInSchema = z.object({
  email: z
    .string()
    .min(5, 'Email must be at least 5 characters.')
    .max(32, 'Email must be at most 32 characters.'),
  password: z
    .string()
    .min(5, 'Password must be at least 5 characters.')
    .max(32, 'Password must be at most 32 characters.'),
})
