const KEYS = {
  token: 'app.auth.token',
  user: 'app.auth.user',
  expiresAt: 'app.auth.expires-at',
} as const

const KEY_VALUES: ReadonlyArray<string> = Object.values(KEYS)

/** A null key means another tab called `localStorage.clear()`. */
export function isAuthStorageKey(key: string | null): boolean {
  return key === null || KEY_VALUES.includes(key)
}

// localStorage throws rather than returning null when storage is blocked. An
// uncaught throw here would break every request through the interceptor.
function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Lost for this session; the caller has already updated in-memory state.
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // See writeItem.
  }
}

export const authStorage = {
  getToken(): string | null {
    return readItem(KEYS.token)
  },

  setToken(token: string): void {
    writeItem(KEYS.token, token)
  },

  /** `unknown` on purpose — the stored blob may predate the current shape. */
  getUser(): unknown {
    const raw = readItem(KEYS.user)
    if (raw === null) return null

    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  setUser(user: unknown): void {
    try {
      writeItem(KEYS.user, JSON.stringify(user))
    } catch {
      // Not serialisable.
    }
  },

  /** Epoch ms. Null when the server did not say when the token dies. */
  getExpiresAt(): number | null {
    const raw = readItem(KEYS.expiresAt)
    if (raw === null) return null

    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  },

  setExpiresAt(epochMs: number | null): void {
    if (epochMs === null) {
      removeItem(KEYS.expiresAt)
      return
    }
    writeItem(KEYS.expiresAt, String(epochMs))
  },

  clear(): void {
    removeItem(KEYS.token)
    removeItem(KEYS.user)
    removeItem(KEYS.expiresAt)
  },
}
