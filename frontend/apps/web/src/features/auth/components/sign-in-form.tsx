import { useTranslation } from 'react-i18next'
import { useRouter, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '#/lib/auth-context'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { FieldGroup } from '@app/ui/components/field'
import { Button } from '@app/ui/components/button'
import { InputField } from '@app/ui/components/fields'
import { getApiErrorMessage } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { signInSchema } from '../validation/sign-in.schema'
import { loginUser } from '../api/auth.api'

type Props = {
  redirect?: string
}

export function SignInForm({ redirect }: Props) {
  const { t } = useTranslation()
  const auth = useAuth()
  const router = useRouter()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (response) => {
      auth.login(response.data, response.token, response.expires_in)
      toast.success(response.message)

      try {
        await router.invalidate()
        await navigate({ to: redirect ?? '/' })
      } catch (err) {
        logger.error({ err }, 'Post-sign-in navigation failed')
        toast.error(t('auth.signIn.navigationFailed'))
      }
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Sign-in failed')
      toast.error(getApiErrorMessage(error, t('auth.signIn.failed')))
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        logOnFail(() => form.handleSubmit(), t('auth.signIn.submitFailed'))
      }}
      className="flex flex-col gap-5"
    >
      <FieldGroup className="gap-4">
        <InputField
          form={form}
          name="email"
          label={t('auth.signIn.email')}
          placeholder={t('auth.signIn.emailPlaceholder')}
          inputProps={{ autoComplete: 'email', autoFocus: true }}
        />
        <InputField
          form={form}
          name="password"
          label={t('auth.signIn.password')}
          type="password"
          placeholder={t('auth.signIn.password')}
          inputProps={{ autoComplete: 'current-password' }}
        />
      </FieldGroup>
      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending
          ? t('auth.signIn.pending')
          : t('auth.signIn.action')}
      </Button>
    </form>
  )
}
