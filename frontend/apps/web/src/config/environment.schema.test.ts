import { describe, expect, it } from 'vitest'
import { defineEnvironment, sameOrigin } from './environment.schema'

const valid = {
  production: false,
  appName: 'SparkyLink',
  apiUrl: 'http://localhost',
  authStrategy: 'bearer',
} as const

describe('defineEnvironment', () => {
  it('returns the config when it is valid', () => {
    expect(defineEnvironment({ ...valid })).toEqual(valid)
  })

  it('names the offending field when a value is malformed', () => {
    expect(() =>
      defineEnvironment({ ...valid, apiUrl: 'not-a-url' }),
    ).toThrowError(/apiUrl/)
  })

  it('rejects a trailing slash on apiUrl, which would produce //api paths', () => {
    expect(() =>
      defineEnvironment({ ...valid, apiUrl: 'http://localhost/' }),
    ).toThrowError(/trailing slash/)
  })

  it('rejects a missing field rather than defaulting it', () => {
    const { apiUrl: _omitted, ...withoutApiUrl } = valid
    expect(() => defineEnvironment(withoutApiUrl)).toThrowError(/apiUrl/)
  })

  // Isti build radi na localhost-u, IP adresi racunara i produkcionom domenu.
  it('allows localhost and a LAN address in production, since the API is same-origin', () => {
    expect(() =>
      defineEnvironment({ ...valid, production: true }),
    ).not.toThrow()
    expect(() =>
      defineEnvironment({ ...valid, production: true, apiUrl: 'http://192.168.31.204' }),
    ).not.toThrow()
  })

  it('falls back to localhost without a window (node tests)', () => {
    expect(sameOrigin()).toBe('http://localhost')
  })
})
