import { SignInForm } from '../components/sign-in-form'
import { Link } from '@tanstack/react-router'
import { environment } from '#/config/environment'
import { useTranslation } from 'react-i18next'

type Props = {
  redirect?: string
}

export function SignInPage({ redirect }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="flex h-14 shrink-0 items-center border-b bg-card px-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-sm font-semibold"
          >
            <img src="/icons/icon-192.png" alt="" className="size-8 rounded-md" />
            {environment.appName}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-5 text-center">
            <img src="/api/files/logo" alt="Cekić Elektrik" className="mx-auto mb-4 h-24 w-auto rounded-md bg-white p-2" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('auth.signIn.title')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('auth.signIn.description')}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-xs sm:p-6">
            <SignInForm redirect={redirect} />
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {environment.appName}
          </p>
        </div>
      </main>
    </div>
  )
}
