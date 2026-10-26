import z from 'zod'
import type { TFunction } from 'i18next'

export function createUserSchema(t: TFunction) {
  return z
    .object({
      name: z.string().trim().min(2, t('users.create.errors.name')),
      email: z.string().trim().email(t('users.create.errors.email')),
      role_id: z.string().min(1, t('users.edit.invalidRole')),
      password: z.string().min(8, t('users.create.errors.password')),
      password_confirmation: z.string(),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t('users.create.errors.passwordMatch'),
      path: ['password_confirmation'],
    })
}
