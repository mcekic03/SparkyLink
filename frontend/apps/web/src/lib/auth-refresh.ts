import axios from 'axios'
import { environment } from '#/config/environment'
import { authStore } from '#/lib/auth-store'
import { sessionResponseSchema } from '#/types/session'

/**
 * Backend contract (Laravel Sanctum, `AuthController@refresh`):
 *
 *   POST /api/admin/refresh
 *   Authorization: Bearer <current token>
 *   -> the same body as /api/admin/login: { message, token, expires_in, data }
 *
 * The old token is revoked server-side and a fresh one is issued.
 */
const REFRESH_PATH = '/api/admin/refresh'

/**
 * Its own client, deliberately. Going through `api` would send the refresh
 * request back through the response interceptor, so a failing refresh would
 * trigger another refresh.
 */
const refreshClient = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

let inFlight: Promise<boolean> | null = null

/**
 * Single-flight: a page with several queries in flight gets a 401 on each, and
 * every one of them must wait on the same refresh rather than starting its own.
 *
 * Resolves true when the session was renewed.
 */
export function refreshSession(): Promise<boolean> {
  inFlight ??= performRefresh().finally(() => {
    inFlight = null
  })

  return inFlight
}

async function performRefresh(): Promise<boolean> {
  const token = authStore.getToken()
  if (token === null) return false

  try {
    const response = await refreshClient.post<unknown>(REFRESH_PATH, null, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const session = sessionResponseSchema.parse(response.data)
    authStore.login(session.data, session.token, session.expires_in)
    return true
  } catch {
    // A rejected or malformed refresh means the session is genuinely over; the
    // caller ends it.
    return false
  }
}

/** Test seam — the module-level promise otherwise leaks between tests. */
export function resetRefreshState(): void {
  inFlight = null
}
