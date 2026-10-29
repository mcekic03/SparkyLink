import z from 'zod'
import type { TFunction } from 'i18next'

export function fuseBoardNameSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('fuseBoards.form.nameRequired')).max(255, t('fuseBoards.form.nameTooLong')),
  })
}
