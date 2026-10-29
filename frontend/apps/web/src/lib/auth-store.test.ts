import { afterEach, describe, expect, it, vi } from 'vitest'
import { authStorage } from './auth-storage'
import { bearerStrategy, createAuthStore } from './auth-store'
import { UserRole } from '#/types/user'
import type { User } from '#/types/user'

const user: User = {
  id: 1,
  role_id: UserRole.SuperAdmin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

/** A fresh store, since the module singleton hydrates once at import time. */
function freshStore() {
  return createAuthStore(bearerStrategy)
}

describe('authStore', () => {
  describe('hydrate', () => {
    it('starts signed out with empty storage', () => {
      const store = freshStore()
      expect(store.getSnapshot()).toEqual({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
      })
    })

    it('restores a complete session', () => {
      authStorage.setUser(user)
      authStorage.setToken('abc123')

      const store = freshStore()

      expect(store.isAuthenticated()).toBe(true)
      expect(store.getUser()).toEqual(user)
      expect(store.getToken()).toBe('abc123')
    })

    it('treats a token with no user as signed out', () => {
      authStorage.setToken('abc123')

      expect(freshStore().isAuthenticated()).toBe(false)
    })

    it('treats a user with no token as signed out', () => {
      authStorage.setUser(user)

      expect(freshStore().isAuthenticated()).toBe(false)
    })

    it('treats a user whose stored shape no longer parses as signed out', () => {
      authStorage.setUser({ id: 'not-a-number', name: 'Ada' })
      authStorage.setToken('abc123')

      expect(freshStore().isAuthenticated()).toBe(false)
    })

    it('rejects a stored user carrying an unknown role', () => {
      authStorage.setUser({ ...user, role_id: 99 })
      authStorage.setToken('abc123')

      expect(freshStore().isAuthenticated()).toBe(false)
    })
  })

  describe('login and logout', () => {
    it('login persists and exposes the session', () => {
      const store = freshStore()
      store.login(user, 'abc123')

      expect(store.isAuthenticated()).toBe(true)
      expect(authStorage.getToken()).toBe('abc123')
      expect(freshStore().isAuthenticated()).toBe(true)
    })

    it('logout clears both memory and storage', () => {
      const store = freshStore()
      store.login(user, 'abc123')
      store.logout()

      expect(store.getSnapshot()).toEqual({
        user: null,
        token: null,
        expiresAt: null,
        isAuthenticated: false,
      })
      expect(authStorage.getToken()).toBeNull()
      expect(authStorage.getUser()).toBeNull()
    })
  })

  describe('subscriptions', () => {
    it('notifies subscribers on login and logout', () => {
      const store = freshStore()
      const listener = vi.fn()
      store.subscribe(listener)

      store.login(user, 'abc123')
      expect(listener).toHaveBeenCalledTimes(1)

      store.logout()
      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('stops notifying after unsubscribe', () => {
      const store = freshStore()
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)

      unsubscribe()
      store.login(user, 'abc123')

      expect(listener).not.toHaveBeenCalled()
    })

    it('returns a stable snapshot reference until state changes', () => {
      const store = freshStore()
      expect(store.getSnapshot()).toBe(store.getSnapshot())

      const before = store.getSnapshot()
      store.login(user, 'abc123')
      expect(store.getSnapshot()).not.toBe(before)
    })
  })

  describe('rehydrate', () => {
    it('picks up a sign-out performed in another tab', () => {
      const store = freshStore()
      store.login(user, 'abc123')

      authStorage.clear() // as another tab would
      store.rehydrate()

      expect(store.isAuthenticated()).toBe(false)
    })

    it('notifies subscribers', () => {
      const store = freshStore()
      const listener = vi.fn()
      store.subscribe(listener)

      store.rehydrate()

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('strategy seam', () => {
    it('reports which transport is active', () => {
      expect(freshStore().strategyName).toBe('bearer')
    })

    it('routes all persistence through the strategy', () => {
      const clear = vi.fn()
      const store = createAuthStore({
        name: 'cookie',
        hydrate: () => ({
          user: null,
          token: null,
          expiresAt: null,
          isAuthenticated: false,
        }),
        persist: () => ({
          user,
          token: null,
          expiresAt: null,
          isAuthenticated: true,
        }),
        clear,
      })

      store.login(user, 'ignored-by-this-strategy')
      expect(store.isAuthenticated()).toBe(true)
      expect(store.getToken()).toBeNull()

      store.logout()
      expect(clear).toHaveBeenCalledTimes(1)
    })
  })
})

describe('expiry', () => {
  const HOUR_MS = 60 * 60 * 1000

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores an absolute expiry derived from expires_in seconds', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const store = freshStore()
    store.login(user, 'abc123', 3600)

    expect(store.getSnapshot().expiresAt).toBe(Date.now() + HOUR_MS)
    expect(authStorage.getExpiresAt()).toBe(Date.now() + HOUR_MS)
  })

  it('treats a null expires_in as no known expiry', () => {
    const store = freshStore()
    store.login(user, 'abc123', null)

    expect(store.getSnapshot().expiresAt).toBeNull()
    expect(authStorage.getExpiresAt()).toBeNull()
  })

  // The whole point of the stage: isAuthenticated stops being a presence check.
  it('hydrates an expired token as signed out', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    authStorage.setUser(user)
    authStorage.setToken('abc123')
    authStorage.setExpiresAt(Date.now() - 1)

    expect(freshStore().isAuthenticated()).toBe(false)
  })

  it('hydrates a still-valid token as signed in', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    authStorage.setUser(user)
    authStorage.setToken('abc123')
    authStorage.setExpiresAt(Date.now() + HOUR_MS)

    expect(freshStore().isAuthenticated()).toBe(true)
  })

  it('clears storage when it finds an expired token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    authStorage.setUser(user)
    authStorage.setToken('abc123')
    authStorage.setExpiresAt(Date.now() - 1)

    freshStore()

    expect(authStorage.getToken()).toBeNull()
    expect(authStorage.getUser()).toBeNull()
    expect(authStorage.getExpiresAt()).toBeNull()
  })

  it('signs out on its own when the token expires while the app is open', () => {
    vi.useFakeTimers()
    const store = freshStore()
    const listener = vi.fn()
    store.subscribe(listener)

    store.login(user, 'abc123', 3600)
    expect(store.isAuthenticated()).toBe(true)

    vi.advanceTimersByTime(HOUR_MS)

    expect(store.isAuthenticated()).toBe(false)
    expect(authStorage.getToken()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('does not sign out before the token expires', () => {
    vi.useFakeTimers()
    const store = freshStore()
    store.login(user, 'abc123', 3600)

    vi.advanceTimersByTime(HOUR_MS - 1000)

    expect(store.isAuthenticated()).toBe(true)
  })

  it('cancels a pending timer on logout', () => {
    vi.useFakeTimers()
    const store = freshStore()
    store.login(user, 'abc123', 3600)
    store.logout()

    const listener = vi.fn()
    store.subscribe(listener)
    vi.advanceTimersByTime(HOUR_MS * 2)

    expect(listener).not.toHaveBeenCalled()
  })

  it('replaces a pending timer when logging in again', () => {
    vi.useFakeTimers()
    const store = freshStore()
    store.login(user, 'abc123', 1)
    store.login(user, 'def456', 3600)

    vi.advanceTimersByTime(5000)

    expect(store.isAuthenticated()).toBe(true)
  })

  // setTimeout fires immediately past 2^31-1 ms, which would sign the user out
  // the moment they arrive.
  it('does not schedule a timer for an expiry beyond the setTimeout ceiling', () => {
    vi.useFakeTimers()
    const store = freshStore()
    store.login(user, 'abc123', 60 * 60 * 24 * 365)

    vi.advanceTimersByTime(10_000)

    expect(store.isAuthenticated()).toBe(true)
  })
})
