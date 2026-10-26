import { afterEach, describe, expect, it, vi } from 'vitest'
import { authStorage, isAuthStorageKey } from './auth-storage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('authStorage', () => {
  describe('token', () => {
    it('round-trips a token', () => {
      authStorage.setToken('abc123')
      expect(authStorage.getToken()).toBe('abc123')
    })

    it('returns null when nothing is stored', () => {
      expect(authStorage.getToken()).toBeNull()
    })
  })

  describe('user', () => {
    it('round-trips a user object', () => {
      authStorage.setUser({ id: 1, name: 'Ada' })
      expect(authStorage.getUser()).toEqual({ id: 1, name: 'Ada' })
    })

    it('returns null when nothing is stored', () => {
      expect(authStorage.getUser()).toBeNull()
    })

    it('returns null for malformed JSON rather than throwing', () => {
      localStorage.setItem('app.auth.user', '{not json')
      expect(authStorage.getUser()).toBeNull()
    })

    it('does not throw when the value is not serialisable', () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      expect(() => authStorage.setUser(circular)).not.toThrow()
    })
  })

  describe('clear', () => {
    it('removes both token and user', () => {
      authStorage.setToken('abc123')
      authStorage.setUser({ id: 1 })

      authStorage.clear()

      expect(authStorage.getToken()).toBeNull()
      expect(authStorage.getUser()).toBeNull()
    })
  })

  describe('when localStorage is unavailable', () => {
    it('reads as null instead of throwing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(() => authStorage.getToken()).not.toThrow()
      expect(authStorage.getToken()).toBeNull()
      expect(authStorage.getUser()).toBeNull()
    })

    it('swallows write failures', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => authStorage.setToken('abc123')).not.toThrow()
      expect(() => authStorage.setUser({ id: 1 })).not.toThrow()
    })

    it('swallows removal failures', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(() => authStorage.clear()).not.toThrow()
    })
  })

  describe('isAuthStorageKey', () => {
    it('matches the keys this module actually writes', () => {
      authStorage.setToken('abc123')
      authStorage.setUser({ id: 1 })

      const written = Object.keys(localStorage)
      expect(written.length).toBeGreaterThan(0)
      for (const key of written) {
        expect(isAuthStorageKey(key)).toBe(true)
      }
    })

    it('ignores unrelated keys', () => {
      expect(isAuthStorageKey('some.other.key')).toBe(false)
    })

    it('treats a null key as relevant', () => {
      expect(isAuthStorageKey(null)).toBe(true)
    })
  })

  describe('key naming', () => {
    it('uses the documented localStorage keys', () => {
      authStorage.setToken('abc123')
      authStorage.setUser({ id: 1 })

      expect(localStorage.getItem('app.auth.token')).toBe('abc123')
      expect(localStorage.getItem('app.auth.user')).toBe('{"id":1}')
    })
  })
})
