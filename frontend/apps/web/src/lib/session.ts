import { authStore } from '#/lib/auth-store'

type SessionEndedHandler = () => void

let handler: SessionEndedHandler | null = null

/** Registered by the composition root, which owns the router. */
export function onSessionEnded(fn: SessionEndedHandler): () => void {
  handler = fn
  return () => {
    if (handler === fn) handler = null
  }
}

/**
 * Called when the server rejects our credentials.
 *
 * No-ops when already signed out: a page with several queries in flight gets a
 * 401 on each when a token expires, and without this every one would fire a
 * redirect.
 */
export function endSession(): void {
  if (!authStore.isAuthenticated()) return

  authStore.logout()
  handler?.()
}
