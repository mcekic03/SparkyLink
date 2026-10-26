import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { environment } from '#/config/environment'
import { authStore } from '#/lib/auth-store'
import { server } from '#/test/msw/server'
import { UserRole } from '#/types/user'
import { loginUser } from './auth.api'

const LOGIN_URL = `${environment.apiUrl}/api/admin/login`

const validResponse = {
  message: 'Signed in',
  token: 'abc123',
  expires_in: 3600,
  data: {
    id: 1,
    role_id: UserRole.Admin,
    name: 'Ada',
    email: 'ada@example.com',
    created_at: '2026-01-01T00:00:00Z',
  },
}

function respondWith(body: Record<string, unknown>) {
  server.use(http.post(LOGIN_URL, () => HttpResponse.json(body)))
}

afterEach(() => {
  authStore.logout()
  localStorage.clear()
})

describe('loginUser', () => {
  it('returns the parsed response', async () => {
    respondWith(validResponse)

    await expect(
      loginUser({ email: 'ada@example.com', password: 'secret' }),
    ).resolves.toEqual(validResponse)
  })

  it('rejects a response whose user is malformed', async () => {
    respondWith({ ...validResponse, data: { id: 'not-a-number' } })

    await expect(
      loginUser({ email: 'ada@example.com', password: 'secret' }),
    ).rejects.toThrow()
  })

  it('rejects a response carrying an unknown role', async () => {
    respondWith({
      ...validResponse,
      data: { ...validResponse.data, role_id: 99 },
    })

    await expect(
      loginUser({ email: 'ada@example.com', password: 'secret' }),
    ).rejects.toThrow()
  })

  it('rejects a response with no token', async () => {
    respondWith({ ...validResponse, token: '' })

    await expect(
      loginUser({ email: 'ada@example.com', password: 'secret' }),
    ).rejects.toThrow()
  })

  it('accepts a null expires_in, which the API may send', async () => {
    respondWith({ ...validResponse, expires_in: null })

    await expect(
      loginUser({ email: 'ada@example.com', password: 'secret' }),
    ).resolves.toMatchObject({ expires_in: null })
  })
})
