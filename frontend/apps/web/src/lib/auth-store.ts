import { authStorage, isAuthStorageKey } from '#/lib/auth-storage'
import { parseStoredUser } from '#/types/user'
import type { User } from '#/types/user'

export interface AuthSnapshot {
  readonly user: User | null
  readonly token: string | null
  /** Epoch ms, or null when the server did not say. */
  readonly expiresAt: number | null
  readonly isAuthenticated: boolean
}

/**
 * What differs between transports. Cookie mode keeps nothing in JS: `token`
 * stays null and the session is confirmed by a `/me` call at boot.
 */
export interface AuthStrategy {
  readonly name: 'bearer' | 'cookie'
  hydrate(): AuthSnapshot
  persist(user: User, token: string, expiresAt: number | null): AuthSnapshot
  clear(): void
}

const SIGNED_OUT: AuthSnapshot = {
  user: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
}

export const bearerStrategy: AuthStrategy = {
  name: 'bearer',

  hydrate() {
    const token = authStorage.getToken()
    const user = parseStoredUser(authStorage.getUser())

    // Both or neither. A half-state renders the app as signed in and then 401s
    // on every request.
    if (token === null || user === null) return SIGNED_OUT

    const expiresAt = authStorage.getExpiresAt()
    if (expiresAt !== null && expiresAt <= Date.now()) {
      // Drop it rather than leaving a dead token to be re-read next time.
      authStorage.clear()
      return SIGNED_OUT
    }

    return { user, token, expiresAt, isAuthenticated: true }
  },

  persist(user, token, expiresAt) {
    authStorage.setUser(user)
    authStorage.setToken(token)
    authStorage.setExpiresAt(expiresAt)
    return { user, token, expiresAt, isAuthenticated: true }
  },

  clear() {
    authStorage.clear()
  },
}

// setTimeout fires immediately past this, so a very distant expiry is left to
// the hydrate-time check and the 401 interceptor instead.
const MAX_TIMEOUT_MS = 2_147_483_647

function createAuthStore(strategy: AuthStrategy) {
  let snapshot: AuthSnapshot = strategy.hydrate()
  const listeners = new Set<() => void>()
  let expiryTimer: ReturnType<typeof setTimeout> | null = null

  function emit() {
    for (const listener of listeners) listener()
  }

  function signOut() {
    if (expiryTimer !== null) {
      clearTimeout(expiryTimer)
      expiryTimer = null
    }
    strategy.clear()
    snapshot = SIGNED_OUT
    emit()
  }

  // Without this the app keeps looking signed in until the next request 401s.
  function scheduleExpiry(expiresAt: number | null) {
    if (expiryTimer !== null) {
      clearTimeout(expiryTimer)
      expiryTimer = null
    }
    if (expiresAt === null) return

    const delay = expiresAt - Date.now()
    if (delay <= 0 || delay > MAX_TIMEOUT_MS) return

    expiryTimer = setTimeout(signOut, delay)
  }

  scheduleExpiry(snapshot.expiresAt)

  // Arrow properties, not methods: these are passed detached, e.g.
  // `useSyncExternalStore(authStore.subscribe, authStore.getSnapshot)`.
  return {
    strategyName: strategy.name,

    /** Stable reference until state changes — useSyncExternalStore requires it. */
    getSnapshot: (): AuthSnapshot => snapshot,

    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    /** `expiresInSeconds` is the API's `expires_in`; null means unknown. */
    login: (
      user: User,
      token: string,
      expiresInSeconds: number | null = null,
    ): void => {
      const expiresAt =
        expiresInSeconds === null ? null : Date.now() + expiresInSeconds * 1000

      snapshot = strategy.persist(user, token, expiresAt)
      scheduleExpiry(expiresAt)
      emit()
    },

    logout: (): void => {
      signOut()
    },

    rehydrate: (): void => {
      snapshot = strategy.hydrate()
      scheduleExpiry(snapshot.expiresAt)
      emit()
    },

    getToken: (): string | null => snapshot.token,
    getUser: (): User | null => snapshot.user,
    isAuthenticated: (): boolean => snapshot.isAuthenticated,
  }
}

export const authStore = createAuthStore(bearerStrategy)

export type AuthStore = ReturnType<typeof createAuthStore>

/** `storage` fires only in other tabs, so this cannot loop. */
export function syncAcrossTabs(store: AuthStore = authStore): () => void {
  function onStorage(event: StorageEvent) {
    if (isAuthStorageKey(event.key)) store.rehydrate()
  }

  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('storage', onStorage)
  }
}

export { createAuthStore }
