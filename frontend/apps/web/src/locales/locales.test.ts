import { describe, expect, it } from 'vitest'
import en from './en.json'
import sr from './sr.json'

function flatten(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]

  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  )
}

const enKeys = flatten(en).toSorted()
const srKeys = flatten(sr).toSorted()

function valueAtPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => {
    if (typeof node !== 'object' || node === null) return undefined
    return Reflect.get(node, part)
  }, value)
}

describe('locale files', () => {
  // A missing key renders as the raw key path in the UI, which is easy to ship
  // unnoticed when only one language is being looked at.
  it('sr has every key en has', () => {
    expect(enKeys.filter((key) => !srKeys.includes(key))).toEqual([])
  })

  it('sr has no keys en lacks', () => {
    expect(srKeys.filter((key) => !enKeys.includes(key))).toEqual([])
  })

  it('has no empty translations', () => {
    const empty = Object.entries({ en, sr }).flatMap(([locale, bundle]) =>
      flatten(bundle)
        .filter((key) => {
          const value = valueAtPath(bundle, key)
          return typeof value !== 'string' || value.trim() === ''
        })
        .map((key) => `${locale}:${key}`),
    )

    expect(empty).toEqual([])
  })
})
