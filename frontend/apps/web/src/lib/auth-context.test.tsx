/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { authStorage } from '#/lib/auth-storage'
import { authStore } from '#/lib/auth-store'
import { UserRole } from '#/types/user'
import type { User } from '#/types/user'
import { AuthProvider, useAuth } from './auth-context'

const user: User = {
  id: 1,
  role_id: UserRole.SuperAdmin,
  name: 'Ada',
  email: 'ada@example.com',
  created_at: '2026-01-01T00:00:00Z',
}

function Probe() {
  const auth = useAuth()
  return (
    <output>
      {auth.isAuthenticated ? `signed in as ${auth.user?.name}` : 'signed out'}
    </output>
  )
}

afterEach(() => {
  act(() => {
    authStore.logout()
  })
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('renders the store snapshot', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('signed out')
  })

  it('re-renders when the store changes from outside React', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    act(() => {
      authStore.login(user, 'abc123')
    })

    expect(screen.getByRole('status')).toHaveTextContent('signed in as Ada')

    act(() => {
      authStore.logout()
    })

    expect(screen.getByRole('status')).toHaveTextContent('signed out')
  })

  it('reacts to another tab clearing storage', () => {
    act(() => {
      authStore.login(user, 'abc123')
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('signed in as Ada')

    act(() => {
      authStorage.clear()
      // `storage` fires only in *other* tabs, so it has to be simulated here.
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'app.auth.token' }),
      )
    })

    expect(screen.getByRole('status')).toHaveTextContent('signed out')
  })

  it('ignores unrelated storage keys', () => {
    act(() => {
      authStore.login(user, 'abc123')
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'some.other.key' }),
      )
    })

    expect(screen.getByRole('status')).toHaveTextContent('signed in as Ada')
  })

  it('throws when used outside the provider', () => {
    expect(() => render(<Probe />)).toThrowError(/within an AuthProvider/)
  })
})
