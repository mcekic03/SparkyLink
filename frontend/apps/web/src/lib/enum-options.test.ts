import { describe, expect, it, vi } from 'vitest'
import { enumOptions } from './enum-options'

/** Probni enum: pomoćna funkcija je opšta i ne zavisi od enuma iz aplikacije. */
enum Fuse {
  B = 1,
  C = 2,
  D = 3,
}

const LABELS: Record<string, string> = {
  'fuses.types.1': 'Type B',
  'fuses.types.2': 'Type C',
  'fuses.types.3': 'Type D',
}

const translate = (key: string) => LABELS[key] ?? key
const bare = (key: string) => key

describe('enumOptions', () => {
  it('maps every numeric member to a translated option', () => {
    expect(enumOptions(Fuse, 'fuses.types', translate)).toEqual([
      { value: 1, label: 'Type B' },
      { value: 2, label: 'Type C' },
      { value: 3, label: 'Type D' },
    ])
  })

  // Numeric enums carry reverse string keys, which would otherwise double the list.
  it('ignores the reverse string keys of a numeric enum', () => {
    expect(enumOptions(Fuse, 'fuses.types', translate)).toHaveLength(3)
  })

  // A hand-maintained label map silently returns undefined for a new member;
  // this shows the key instead, so the gap is visible.
  it('falls back to the key when a translation is missing', () => {
    expect(enumOptions(Fuse, 'fuses.types', bare)[0]).toEqual({
      value: 1,
      label: 'fuses.types.1',
    })
  })

  it('passes the built key through to the translator', () => {
    const spy = vi.fn((key: string) => key)
    enumOptions(Fuse, 'some.prefix', spy)
    expect(spy).toHaveBeenCalledWith('some.prefix.1', {
      defaultValue: 'some.prefix.1',
    })
  })
})
