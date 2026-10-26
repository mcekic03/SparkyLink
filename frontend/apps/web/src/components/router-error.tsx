import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@app/ui/components/button'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { useAuth } from '#/lib/auth-context'

export function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    logger.error({ err: error }, 'Unhandled route error')
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t('errors.generic.title')}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {error.message || t('errors.generic.description')}
      </p>
      <div className="mt-2 flex gap-3">
        <Button
          onClick={() =>
            logOnFail(
              () => router.invalidate(),
              'Retry after route error failed',
            )
          }
        >
          {t('common.retry')}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">{t('common.goHome')}</Link>
        </Button>
      </div>
    </div>
  )
}

export function RouteNotFoundComponent() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t('errors.notFound.title')}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {t('errors.notFound.description')}
      </p>
      <Button asChild className="mt-2">
        <Link to="/">{t('common.goHome')}</Link>
      </Button>
    </div>
  )
}

export function RouteForbiddenComponent() {
  const { logout } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{t('errors.forbidden.title')}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {t('errors.forbidden.description')}
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link to="/dashboard">{t('common.goToDashboard')}</Link>
        </Button>
        {/* Signed in as the wrong account is the other likely cause. */}
        <Button variant="outline" onClick={logout}>
          {t('common.signOut')}
        </Button>
      </div>
    </div>
  )
}
