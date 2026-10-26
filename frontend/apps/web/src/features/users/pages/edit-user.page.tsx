import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import { FieldGroup } from '@app/ui/components/field'
import { Button } from '@app/ui/components/button'
import { Skeleton } from '@app/ui/components/skeleton'
import { PageHeader } from '#/components/page-header'
import { useUnsavedChanges } from '#/components/unsaved-changes'
import { InputField, SelectField } from '@app/ui/components/fields'
import { QueryError } from '#/components/query-error'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { fetchUser, updateUser } from '../api/users.api'
import { usersKeys } from '../api/users.keys'
import { editUserSchema } from '../validation/edit-user.schema'
import { parseUserRole, UserRole } from '../types'
import { enumOptions } from '#/lib/enum-options'
import type { UpdateUserPayload } from '../types'

type Props = {
  userId: string
}

const SKELETON_FIELDS = Array.from({ length: 4 }, (_, i) => `field-${i}`)

export function EditUserPage({ userId }: Props) {
  const { t } = useTranslation()
  const roleOptions = enumOptions(UserRole, 'users.roles', t).map((option) => ({
    label: option.label,
    value: String(option.value),
  }))
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => fetchUser(userId),
  })

  useEffect(() => {
    if (isError) {
      logger.error({ err: error, userId }, 'Failed to fetch user')
    }
  }, [isError, error, userId])

  const mutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => updateUser(userId, data),
    onSuccess: (response) => {
      toast.success(response.message)
      logOnFail(
        () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
        'Failed to invalidate users after update',
        { userId },
      )
    },
    onError: (mutationError: unknown) => {
      logger.error({ err: mutationError, userId }, 'Failed to update user')

      const unmatched = applyFieldErrors(form, mutationError)
      const parsed = toApiError(mutationError)

      if (parsed.kind !== 'validation' || unmatched.length > 0) {
        toast.error(
          getApiErrorMessage(mutationError, t('users.edit.updateFailed')),
        )
      }
    },
  })

  const form = useForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role_id: user ? String(user.role_id) : '',
      password: '',
      password_confirmation: '',
    },
    validators: {
      onSubmit: editUserSchema,
    },
    onSubmit: async ({ value }) => {
      const role = parseUserRole(value.role_id)
      if (role === undefined) {
        toast.error(t('users.edit.invalidRole'))
        return
      }

      mutation.mutate({
        name: value.name,
        email: value.email,
        role_id: role,
        // Blank means "keep current" — omit rather than posting empty strings.
        ...(value.password
          ? {
              password: value.password,
              password_confirmation: value.password_confirmation,
            }
          : {}),
      })
    },
  })

  // Registers this form with the provider in AuthedLayout, which blocks router
  // navigation while it holds edits. `isDirty` is read through the store so the
  // component re-renders when it flips — `form.state` is a snapshot.
  const isDirty = useStore(form.store, (state) => state.isDirty)
  useUnsavedChanges(isDirty)

  if (isLoading) {
    return (
      <div className="min-w-0  p-8">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-4 h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
        <div className="mt-8 space-y-6">
          {SKELETON_FIELDS.map((id) => (
            <Skeleton key={id} className="h-10 w-full max-w-md" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-w-0 p-8">
        <QueryError
          error={error}
          title={t('users.edit.loadFailed')}
          onRetry={() =>
            logOnFail(() => refetch(), 'Retry fetching user failed', {
              userId,
            })
          }
        />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title={t('users.edit.title')}
        description={t('users.edit.description', { name: user?.name ?? '' })}
      />

      <div className="max-w-2xl rounded-lg border bg-card p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            logOnFail(
              () => form.handleSubmit(),
              'Edit user form submission failed',
              { userId },
            )
          }}
          className="space-y-5"
        >
          <FieldGroup className="gap-4">
            <InputField
              form={form}
              name="name"
              label={t('users.columns.name')}
              placeholder={t('users.edit.namePlaceholder')}
            />
            <InputField
              form={form}
              name="email"
              label={t('users.columns.email')}
              type="email"
              placeholder={t('auth.signIn.emailPlaceholder')}
            />
            <SelectField
              form={form}
              name="role_id"
              label={t('users.columns.role')}
              placeholder={t('users.edit.selectRole')}
              options={roleOptions}
            />
            <InputField
              form={form}
              name="password"
              label={t('auth.signIn.password')}
              type="password"
              placeholder={t('users.edit.passwordHint')}
            />
            <InputField
              form={form}
              name="password_confirmation"
              label={t('users.edit.confirmPassword')}
              type="password"
              placeholder={t('users.edit.repeatPassword')}
            />
          </FieldGroup>

          <div className="flex border-t pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
