import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { routeTree } from './routeTree.gen'
import { AuthProvider } from '#/lib/auth-context'
import '#/lib/i18n'
import { environment } from '#/config/environment'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { onSessionEnded } from '#/lib/session'
import { queryClient } from './lib/query-client'
import {
  RouteErrorComponent,
  RouteNotFoundComponent,
} from './components/router-error'

// Dev-only
logger.info(
  { sha: __BUILD_SHA__, builtAt: __BUILD_TIME__, apiUrl: environment.apiUrl },
  'Application starting',
)

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultErrorComponent: RouteErrorComponent,
  defaultNotFoundComponent: RouteNotFoundComponent,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  useEffect(
    () =>
      onSessionEnded(() => {
        const from = router.state.location.href
        if (router.state.location.pathname === '/sign-in') return

        logOnFail(
          () =>
            router.navigate({
              to: '/sign-in',
              search: { redirect: from },
              replace: true,
            }),
          'Redirect after session end failed',
        )
      }),
    [],
  )

  return <RouterProvider router={router} />
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <InnerApp />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  )
}

// PWA: service worker (instalacija na telefon). Pregledac ga dozvoljava samo
// preko HTTPS-a ili na localhost-u; preko IP adrese u lokalnoj mrezi se preskace.
if (environment.production && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    logOnFail(
      () => navigator.serviceWorker.register('/sw.js').then(() => undefined),
      'Service worker registration failed',
    )
  })
}
