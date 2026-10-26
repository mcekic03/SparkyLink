import { Outlet } from '@tanstack/react-router'
import { useFocusOnNavigate } from '#/lib/use-focus-on-navigate'
import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

export function UnauthedLayout({ children }: Props) {
  const contentRef = useFocusOnNavigate<HTMLElement>()

  return (
    <main ref={contentRef} tabIndex={-1} className="min-h-screen outline-none">
      {children ?? <Outlet />}
    </main>
  )
}
