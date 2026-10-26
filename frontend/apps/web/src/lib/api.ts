import axios, { isAxiosError } from 'axios'
import { environment } from '#/config/environment'
import { authStore } from '#/lib/auth-store'
import { currentLocale } from '#/lib/i18n'
import { endSession } from '#/lib/session'
import { refreshSession } from '#/lib/auth-refresh'
import type { InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const API_ORIGIN = new URL(environment.apiUrl).origin

/**
 * `baseURL` alone is not enough: a caller can pass an absolute URL or override
 * `baseURL` per request. Resolves the final URL and fails closed.
 */
export function targetsApiOrigin(
  config: Pick<InternalAxiosRequestConfig, 'url' | 'baseURL'>,
): boolean {
  try {
    const base = config.baseURL ?? environment.apiUrl
    return new URL(config.url ?? '', base).origin === API_ORIGIN
  } catch {
    return false
  }
}

api.interceptors.request.use((config) => {
  // Scoped: attaching unconditionally leaks the token to any third-party host.
  if (!targetsApiOrigin(config)) return config

  const token = authStore.getToken()
  if (token !== null) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Sent once here rather than as a parameter on every endpoint, so the server
  // can localise responses and format dates in the user's own zone.
  config.headers['X-Client-Locale'] = currentLocale()
  config.headers['X-Client-Timezone'] = clientTimezone()

  return config
})

function clientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/** Endpoints reached while signed out, where a 401 means "wrong credentials". */
const UNAUTHENTICATED_PATHS = ['/api/admin/login']

export function isUnauthenticatedEndpoint(url: string | undefined): boolean {
  return UNAUTHENTICATED_PATHS.some((path) => (url ?? '').endsWith(path))
}

/** Marks a request already replayed after a refresh, so it cannot loop. */
const REPLAYED = Symbol('replayed')

type ReplayableConfig = InternalAxiosRequestConfig & { [REPLAYED]?: true }

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (isAxiosError(error)) {
    const status = error.response?.status
    const config = error.config as ReplayableConfig | undefined

    // The sign-in request is exempt: a wrong password is a 401 too, and treating
    // it as an expired session redirects to the page you are already on.
    const isSessionFailure =
      (status === 401 || status === 403) &&
      !isUnauthenticatedEndpoint(config?.url)

    // Only 401 is worth a refresh. A 403 means authenticated but not permitted,
    // which a newer token will not change.
    if (
      status === 401 &&
      isSessionFailure &&
      config !== undefined &&
      config[REPLAYED] !== true &&
      authStore.isAuthenticated()
    ) {
      if (await refreshSession()) {
        config[REPLAYED] = true
        return api.request(config)
      }
    }

    if (isSessionFailure) {
      endSession()
    }
  }

  // Still rejected — callers keep their own error handling.
  return Promise.reject(error)
})
