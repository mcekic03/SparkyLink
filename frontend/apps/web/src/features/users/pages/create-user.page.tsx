import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@app/ui/components/button'
import { FieldGroup } from '@app/ui/components/field'
import { InputField, SelectField } from '@app/ui/components/fields'
import { PageHeader } from '#/components/page-header'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { enumOptions } from '#/lib/enum-options'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { createUser } from '../api/users.api'
import { usersKeys } from '../api/users.keys'
import { UserRole, parseUserRole } from '../types'
import type { CreateUserPayload } from '../types'
import { createUserSchema } from '../validation/create-user.schema'

export function CreateUserPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const roleOptions = enumOptions(UserRole, 'users.roles', t).map((option) => ({
    label: option.label,
    value: String(option.value),
  }))

  const mutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: async (response) => {
      toast.success(response.message)
      logOnFail(() => queryClient.invalidateQueries({ queryKey: usersKeys.all }), 'Invalidate users failed')
      await navigate({ to: '/users', search: {} })
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to create user')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) {
        toast.error(getApiErrorMessage(error, t('users.create.failed')))
      }
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      role_id: String(UserRole.Admin),
      password: '',
      password_confirmation: '',
    },
    validators: { onSubmit: createUserSchema(t) },
    onSubmit: async ({ value }) => {
      const role = parseUserRole(value.role_id)
      if (role === undefined) {
        toast.error(t('users.edit.invalidRole'))
        return
      }
      mutation.mutate({
        name: value.name.trim(),
        email: value.email.trim(),
        role_id: role,
        password: value.password,
        password_confirmation: value.password_confirmation,
      })
    },
  })

  return (
    <div className="min-w-0">
      <PageHeader title={t('users.create.title')} description={t('users.create.description')} />
      <div className="max-w-2xl rounded-lg border bg-card p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Create user form submission failed')
          }}
          className="space-y-5"
        >
          <FieldGroup className="gap-4">
            <InputField form={form} name="name" label={t('users.columns.name')} placeholder={t('users.edit.namePlaceholder')} />
            <InputField form={form} name="email" type="email" label={t('users.columns.email')} />
            <SelectField form={form} name="role_id" label={t('users.columns.role')} options={roleOptions} />
            <InputField form={form} name="password" type="password" label={t('auth.signIn.password')} description={t('users.create.passwordHint')} />
            <InputField form={form} name="password_confirmation" type="password" label={t('users.edit.confirmPassword')} />
          </FieldGroup>
          <div className="flex border-t pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('users.create.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
