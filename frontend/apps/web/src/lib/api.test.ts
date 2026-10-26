import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { api, isUnauthenticatedEndpoint, targetsApiOrigin } from './api'
import { onSessionEnded } from './session'
import { resetRefreshState } from './auth-refresh'
import { authStore } from './auth-store'
import { environment } from '#/config/environment'
import { server } from '#/test/msw/server'
import { UserRole } from '#/types/user'
import type { User } from '#/types/user'

const user: User = {
  id: 1,
  role_id: UserRole.Admin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

function captureAuthHeader(url: string) {
  const seen: { authorization: string | null } = { authorization: null }

  server.use(
    http.all(url, ({ request }) => {
      seen.authorization = request.headers.get('authorization')
      return HttpResponse.json({})
    }),
  )

  return seen
}

afterEach(() => {
  resetRefreshState()
  authStore.logout()
  localStorage.clear()
})

describe('targetsApiOrigin', () => {
  it('accepts a relative path, which resolves against the API base', () => {
    expect(targetsApiOrigin({ url: '/api/users' })).toBe(true)
  })

  it('accepts an absolute URL on the API origin', () => {
    expect(targetsApiOrigin({ url: `${environment.apiUrl}/api/users` })).toBe(
      true,
    )
  })

  it('rejects an absolute URL on another origin', () => {
    expect(targetsApiOrigin({ url: 'https://evil.example/steal' })).toBe(false)
  })

  it('rejects a per-request baseURL override to another origin', () => {
    expect(
      targetsApiOrigin({ url: '/upload', baseURL: 'https://cdn.example' }),
    ).toBe(false)
  })

  it('accepts an absent url, which means the base itself', () => {
    expect(targetsApiOrigin({})).toBe(true)
  })

  it('fails closed on an unparseable URL', () => {
    expect(targetsApiOrigin({ url: 'http://', baseURL: 'not a url' })).toBe(
      false,
    )
  })
})

describe('request interceptor', () => {
  it('attaches the bearer token for API requests', async () => {
    const seen = captureAuthHeader(`${environment.apiUrl}/api/users`)
    authStore.login(user, 'abc123')

    await api.get('/api/users')

    expect(seen.authorization).toBe('Bearer abc123')
  })

  it('attaches nothing when signed out', async () => {
    const seen = captureAuthHeader(`${environment.apiUrl}/api/users`)

    await api.get('/api/users')

    expect(seen.authorization).toBeNull()
  })

  it('does not leak the token to a third-party origin', async () => {
    const seen = captureAuthHeader('https://evil.example/steal')
    authStore.login(user, 'abc123')

    await api.get('https://evil.example/steal')

    expect(seen.authorization).toBeNull()
  })

  it('does not leak the token via a baseURL override', async () => {
    const seen = captureAuthHeader('https://cdn.example/upload')
    authStore.login(user, 'abc123')

    await api.get('/upload', { baseURL: 'https://cdn.example' })

    expect(seen.authorization).toBeNull()
  })

  it('reads the live store, so a logout takes effect immediately', async () => {
    const seen = captureAuthHeader(`${environment.apiUrl}/api/users`)
    authStore.login(user, 'abc123')
    authStore.logout()

    await api.get('/api/users')

    expect(seen.authorization).toBeNull()
  })
})

function refreshFails() {
  server.use(
    http.post(
      `${environment.apiUrl}/api/admin/refresh`,
      () => new HttpResponse(null, { status: 401 }),
    ),
  )
}

function respondWith(path: string, status: number) {
  server.use(
    http.all(`${environment.apiUrl}${path}`, () =>
      HttpResponse.json({ message: 'nope' }, { status }),
    ),
  )
}

describe('isUnauthenticatedEndpoint', () => {
  it('matches the sign-in endpoint', () => {
    expect(isUnauthenticatedEndpoint('/api/admin/login')).toBe(true)
  })

  it('does not match other endpoints', () => {
    expect(isUnauthenticatedEndpoint('/api/users')).toBe(false)
  })

  it('handles an absent url', () => {
    expect(isUnauthenticatedEndpoint(undefined)).toBe(false)
  })
})

describe('response interceptor', () => {
  it.each([401, 403])('ends the session on %i', async (status) => {
    refreshFails()
    respondWith('/api/users', status)
    const handler = vi.fn()
    const off = onSessionEnded(handler)
    authStore.login(user, 'abc123')

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(authStore.isAuthenticated()).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
    off()
  })

  // A wrong password is a 401 too. Without the exemption, signing in badly
  // redirects to the page you are already on.
  it('leaves the session alone when the sign-in request itself is rejected', async () => {
    respondWith('/api/admin/login', 401)
    const handler = vi.fn()
    const off = onSessionEnded(handler)
    authStore.login(user, 'abc123')

    await expect(
      api.post('/api/admin/login', { email: 'a@b.c', password: 'wrong' }),
    ).rejects.toThrow()

    expect(authStore.isAuthenticated()).toBe(true)
    expect(handler).not.toHaveBeenCalled()
    off()
  })

  it.each([400, 404, 422, 500])('ignores %i', async (status) => {
    respondWith('/api/users', status)
    authStore.login(user, 'abc123')

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(authStore.isAuthenticated()).toBe(true)
  })

  it('ignores a network failure, which has no status', async () => {
    server.use(
      http.all(`${environment.apiUrl}/api/users`, () => HttpResponse.error()),
    )
    authStore.login(user, 'abc123')

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(authStore.isAuthenticated()).toBe(true)
  })

  it('still rejects, so callers keep their own error handling', async () => {
    refreshFails()
    respondWith('/api/users', 401)
    authStore.login(user, 'abc123')

    await expect(api.get('/api/users')).rejects.toMatchObject({
      response: { status: 401 },
    })
  })
})

describe('refresh on 401', () => {
  const REFRESH_URL = `${environment.apiUrl}/api/admin/refresh`
  const USERS_URL = `${environment.apiUrl}/api/users`

  function refreshSucceeds(counter: { calls: number }) {
    server.use(
      http.post(REFRESH_URL, () => {
        counter.calls += 1
        return HttpResponse.json({
          message: 'Refreshed',
          token: 'new-token',
          expires_in: 3600,
          data: user,
        })
      }),
    )
  }

  it('refreshes and replays the original request', async () => {
    const counter = { calls: 0 }
    refreshSucceeds(counter)
    const seenTokens: Array<string | null> = []
    server.use(
      http.get(USERS_URL, ({ request }) => {
        seenTokens.push(request.headers.get('authorization'))
        return seenTokens.length === 1
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ ok: true })
      }),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(api.get('/api/users')).resolves.toMatchObject({
      data: { ok: true },
    })

    expect(counter.calls).toBe(1)
    expect(seenTokens).toEqual(['Bearer old-token', 'Bearer new-token'])
    expect(authStore.isAuthenticated()).toBe(true)
  })

  // Without the replay marker this recurses until the stack gives out.
  it('does not loop when the replayed request also 401s', async () => {
    const counter = { calls: 0 }
    refreshSucceeds(counter)
    let attempts = 0
    server.use(
      http.get(USERS_URL, () => {
        attempts += 1
        return new HttpResponse(null, { status: 401 })
      }),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(attempts).toBe(2)
    expect(counter.calls).toBe(1)
    expect(authStore.isAuthenticated()).toBe(false)
  })

  it('ends the session when the refresh itself fails', async () => {
    server.use(
      http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })),
      http.get(USERS_URL, () => new HttpResponse(null, { status: 401 })),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(authStore.isAuthenticated()).toBe(false)
  })

  // A newer token does not grant permission, so refreshing is pointless.
  it('does not refresh on 403', async () => {
    const counter = { calls: 0 }
    refreshSucceeds(counter)
    server.use(
      http.get(USERS_URL, () => new HttpResponse(null, { status: 403 })),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(api.get('/api/users')).rejects.toThrow()

    expect(counter.calls).toBe(0)
    expect(authStore.isAuthenticated()).toBe(false)
  })

  it('does not refresh when the sign-in request is rejected', async () => {
    const counter = { calls: 0 }
    refreshSucceeds(counter)
    server.use(
      http.post(
        `${environment.apiUrl}/api/admin/login`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(
      api.post('/api/admin/login', { email: 'a@b.c', password: 'wrong' }),
    ).rejects.toThrow()

    expect(counter.calls).toBe(0)
    expect(authStore.isAuthenticated()).toBe(true)
  })

  it('shares one refresh across concurrent 401s', async () => {
    const counter = { calls: 0 }
    refreshSucceeds(counter)
    const failedOnce = new Set<string>()
    server.use(
      http.get(`${environment.apiUrl}/api/:resource`, ({ params }) => {
        const key = String(params.resource)
        if (!failedOnce.has(key)) {
          failedOnce.add(key)
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ ok: true })
      }),
    )
    authStore.login(user, 'old-token', 3600)

    await Promise.all([
      api.get('/api/users'),
      api.get('/api/posts'),
      api.get('/api/teams'),
    ])

    expect(counter.calls).toBe(1)
  })
})

describe('locale and timezone headers', () => {
  it('sends X-Client-Locale and X-Client-Timezone on API requests', async () => {
    const seen: Record<string, string | null> = {}
    server.use(
      http.get(`${environment.apiUrl}/api/users`, ({ request }) => {
        seen.locale = request.headers.get('x-client-locale')
        seen.timezone = request.headers.get('x-client-timezone')
        return HttpResponse.json({})
      }),
    )

    await api.get('/api/users')

    expect(seen.locale).toBe('en')
    expect(seen.timezone).toBeTruthy()
  })

  it('does not send them to a third-party origin', async () => {
    const seen: Record<string, string | null> = {}
    server.use(
      http.get('https://cdn.example/asset', ({ request }) => {
        seen.locale = request.headers.get('x-client-locale')
        return HttpResponse.json({})
      }),
    )

    await api.get('https://cdn.example/asset')

    expect(seen.locale).toBeNull()
  })
})
