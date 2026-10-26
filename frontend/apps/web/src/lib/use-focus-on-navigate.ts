import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

/**
 * Focuses the returned element on every path change. SPA navigation doesn't
 * reset focus, so Tab otherwise resumes from the previous page. Apply to a
 * container with `tabIndex={-1}`.
 */
export function useFocusOnNavigate<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isInitialRender = useRef(true)

  useEffect(() => {
    // Would otherwise fight autofocus on the sign-in field.
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    ref.current?.focus({ preventScroll: true })
  }, [pathname])

  return ref
}
