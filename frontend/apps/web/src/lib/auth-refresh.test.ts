import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { environment } from '#/config/environment'
import { server } from '#/test/msw/server'
import { UserRole } from '#/types/user'
import { authStore } from './auth-store'
import { refreshSession, resetRefreshState } from './auth-refresh'
import type { User } from '#/types/user'

const REFRESH_URL = `${environment.apiUrl}/api/admin/refresh`

const user: User = {
  id: 1,
  role_id: UserRole.SuperAdmin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

function sessionBody(overrides: Record<string, unknown> = {}) {
  return {
    message: 'Refreshed',
    token: 'new-token',
    expires_in: 3600,
    data: user,
    ...overrides,
  }
}

afterEach(() => {
  resetRefreshState()
  authStore.logout()
  localStorage.clear()
})

describe('refreshSession', () => {
  it('replaces the stored session on success', async () => {
    server.use(http.post(REFRESH_URL, () => HttpResponse.json(sessionBody())))
    authStore.login(user, 'old-token', 3600)

    await expect(refreshSession()).resolves.toBe(true)

    expect(authStore.getToken()).toBe('new-token')
    expect(authStore.isAuthenticated()).toBe(true)
  })

  it('sends the current token', async () => {
    const seen: { authorization: string | null } = { authorization: null }
    server.use(
      http.post(REFRESH_URL, ({ request }) => {
        seen.authorization = request.headers.get('authorization')
        return HttpResponse.json(sessionBody())
      }),
    )
    authStore.login(user, 'old-token', 3600)

    await refreshSession()

    expect(seen.authorization).toBe('Bearer old-token')
  })

  it('fails without attempting a request when signed out', async () => {
    let called = 0
    server.use(
      http.post(REFRESH_URL, () => {
        called += 1
        return HttpResponse.json(sessionBody())
      }),
    )

    await expect(refreshSession()).resolves.toBe(false)
    expect(called).toBe(0)
  })

  it('fails when the endpoint rejects', async () => {
    server.use(
      http.post(REFRESH_URL, () => new HttpResponse(null, { status: 401 })),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(refreshSession()).resolves.toBe(false)
  })

  it('fails when the response does not match the session shape', async () => {
    server.use(
      http.post(REFRESH_URL, () =>
        HttpResponse.json(sessionBody({ token: '' })),
      ),
    )
    authStore.login(user, 'old-token', 3600)

    await expect(refreshSession()).resolves.toBe(false)
  })

  // Several queries 401 at once; they must share one refresh, not start their own.
  it('is single-flight under concurrent callers', async () => {
    let called = 0
    server.use(
      http.post(REFRESH_URL, () => {
        called += 1
        return HttpResponse.json(sessionBody())
      }),
    )
    authStore.login(user, 'old-token', 3600)

    const results = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ])

    expect(results).toEqual([true, true, true])
    expect(called).toBe(1)
  })

  it('allows a later refresh after the first settles', async () => {
    let called = 0
    server.use(
      http.post(REFRESH_URL, () => {
        called += 1
        return HttpResponse.json(sessionBody())
      }),
    )
    authStore.login(user, 'old-token', 3600)

    await refreshSession()
    await refreshSession()

    expect(called).toBe(2)
  })
})
