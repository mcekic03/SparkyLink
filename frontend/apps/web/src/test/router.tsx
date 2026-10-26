/* oxlint-disable typescript/no-unsafe-type-assertion */
import { Link, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { AnyRouter, RegisteredRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'

/**
 * For tests with their own route tree. `RouterProvider` and `Link` are typed
 * against the app's registered routes, so the casts live here rather than at
 * every call site.
 */
export function renderRouter(router: AnyRouter) {
  return render(
    <RouterProvider router={router as unknown as RegisteredRouter} />,
  )
}

export function TestLink({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  return <Link to={to as never}>{children}</Link>
}
