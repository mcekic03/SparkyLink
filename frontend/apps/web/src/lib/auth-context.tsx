import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { authStore, syncAcrossTabs } from '#/lib/auth-store'
import type { ReactNode } from 'react'
import type { User } from '#/types/user'

export interface AuthContext {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (user: User, token: string, expiresInSeconds?: number | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  )

  useEffect(() => syncAcrossTabs(), [])

  const value = useMemo<AuthContext>(
    () => ({
      isAuthenticated: snapshot.isAuthenticated,
      user: snapshot.user,
      token: snapshot.token,
      login: authStore.login,
      logout: authStore.logout,
    }),
    [snapshot],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
