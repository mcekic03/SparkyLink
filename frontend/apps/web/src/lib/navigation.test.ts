import { describe, expect, it } from 'vitest'
import { Circle } from 'lucide-react'
import { visibleNavigation } from './navigation'
import type { NavGroup, NavPath } from './navigation'

const GROUPS: readonly NavGroup[] = [
  {
    labelKey: 'nav.groups.general',
    items: [
      { to: '/dashboard', titleKey: 'nav.dashboard', icon: Circle },
      { to: '/users', titleKey: 'nav.users', icon: Circle },
    ],
  },
  {
    labelKey: 'nav.groups.general',
    items: [{ to: '/forbidden', titleKey: 'nav.dashboard', icon: Circle }],
  },
]

const allow =
  (...paths: NavPath[]) =>
  (to: NavPath) =>
    paths.includes(to)

describe('visibleNavigation', () => {
  it('keeps only the items the predicate allows', () => {
    const result = visibleNavigation(GROUPS, allow('/dashboard'))

    expect(result).toHaveLength(1)
    expect(result[0]?.items.map((item) => item.to)).toEqual(['/dashboard'])
  })

  it('drops a group once every item in it is hidden', () => {
    const result = visibleNavigation(GROUPS, allow('/forbidden'))

    expect(result.map((group) => group.items.map((item) => item.to))).toEqual([
      ['/forbidden'],
    ])
  })

  it('returns nothing when everything is hidden', () => {
    expect(visibleNavigation(GROUPS, allow())).toEqual([])
  })

  it('leaves the source untouched', () => {
    visibleNavigation(GROUPS, allow('/dashboard'))

    expect(GROUPS[0]?.items).toHaveLength(2)
  })
})
