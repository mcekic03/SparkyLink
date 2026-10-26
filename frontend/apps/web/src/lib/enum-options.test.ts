import { describe, expect, it, vi } from 'vitest'
import { enumOptions } from './enum-options'
import { UserRole } from '#/types/user'

const LABELS: Record<string, string> = {
  'users.roles.1': 'Super Admin',
  'users.roles.2': 'Admin',
  'users.roles.3': 'Worker',
}

const translate = (key: string) => LABELS[key] ?? key
const bare = (key: string) => key

describe('enumOptions', () => {
  it('maps every numeric member to a translated option', () => {
    expect(enumOptions(UserRole, 'users.roles', translate)).toEqual([
      { value: 1, label: 'Super Admin' },
      { value: 2, label: 'Admin' },
      { value: 3, label: 'Worker' },
    ])
  })

  // Numeric enums carry reverse string keys, which would otherwise double the list.
  it('ignores the reverse string keys of a numeric enum', () => {
    expect(enumOptions(UserRole, 'users.roles', translate)).toHaveLength(3)
  })

  // A hand-maintained label map silently returns undefined for a new member;
  // this shows the key instead, so the gap is visible.
  it('falls back to the key when a translation is missing', () => {
    expect(enumOptions(UserRole, 'users.roles', bare)[0]).toEqual({
      value: 1,
      label: 'users.roles.1',
    })
  })

  it('passes the built key through to the translator', () => {
    const spy = vi.fn((key: string) => key)
    enumOptions(UserRole, 'some.prefix', spy)
    expect(spy).toHaveBeenCalledWith('some.prefix.1', {
      defaultValue: 'some.prefix.1',
    })
  })
})
