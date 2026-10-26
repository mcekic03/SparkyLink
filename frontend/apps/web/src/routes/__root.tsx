import { Suspense, lazy } from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@app/ui/components/sonner'
import { TooltipProvider } from '@app/ui/components/tooltip'
import { environment } from '#/config/environment'

import '../styles.css'

/**
 * Devtools only in development, loaded on demand: in a production build they
 * would only add weight to the initial bundle.
 */
const Devtools = environment.production
  ? null
  : lazy(async () => {
      const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] = await Promise.all([
        import('@tanstack/react-devtools'),
        import('@tanstack/react-router-devtools'),
      ])

      return {
        default: () => (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
          />
        ),
      }
    })

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster />
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </>
  )
}
