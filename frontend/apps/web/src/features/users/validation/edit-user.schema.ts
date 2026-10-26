import z from 'zod'

export const editUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required.'),
    email: z.string().email('Please enter a valid email.'),
    role_id: z.string().min(1, 'Role is required.'),
    password: z.string(),
    password_confirmation: z.string(),
  })
  .refine(
    (data) => !data.password || data.password === data.password_confirmation,
    {
      message: 'Passwords do not match.',
      path: ['password_confirmation'],
    },
  )
