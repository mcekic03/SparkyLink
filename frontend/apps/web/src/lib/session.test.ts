import { afterEach, describe, expect, it, vi } from 'vitest'
import { authStore } from './auth-store'
import { endSession, onSessionEnded } from './session'
import { UserRole } from '#/types/user'
import type { User } from '#/types/user'

const user: User = {
  id: 1,
  role_id: UserRole.Admin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

afterEach(() => {
  authStore.logout()
  localStorage.clear()
})

describe('endSession', () => {
  it('clears auth state and notifies', () => {
    const handler = vi.fn()
    const off = onSessionEnded(handler)
    authStore.login(user, 'abc123')

    endSession()

    expect(authStore.isAuthenticated()).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
    off()
  })

  // Several queries in flight all 401 when a token expires. Without the guard
  // each one fires a redirect.
  it('notifies once even when called repeatedly', () => {
    const handler = vi.fn()
    const off = onSessionEnded(handler)
    authStore.login(user, 'abc123')

    endSession()
    endSession()
    endSession()

    expect(handler).toHaveBeenCalledTimes(1)
    off()
  })

  it('does nothing when already signed out', () => {
    const handler = vi.fn()
    const off = onSessionEnded(handler)

    endSession()

    expect(handler).not.toHaveBeenCalled()
    off()
  })

  it('stops notifying after the handler is removed', () => {
    const handler = vi.fn()
    onSessionEnded(handler)()
    authStore.login(user, 'abc123')

    endSession()

    expect(handler).not.toHaveBeenCalled()
    expect(authStore.isAuthenticated()).toBe(false)
  })
})
