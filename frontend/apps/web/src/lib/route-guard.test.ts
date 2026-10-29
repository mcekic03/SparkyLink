import { describe, expect, it } from 'vitest'
import { checkAccess, requiredRolesFor } from './route-guard'
import { UserRole } from '#/types/user'

const { SuperAdmin } = UserRole
// Aplikacija ima jednu ulogu; druga postoji samo ovde, da se proveri zaštita sa više uloga.
const Admin: UserRole = SuperAdmin + 1

describe('requiredRolesFor', () => {
  it('collects restrictions from the matched chain', () => {
    expect(
      requiredRolesFor([
        { staticData: {} },
        { staticData: { roles: [Admin, SuperAdmin] } },
        { staticData: { roles: [SuperAdmin] } },
      ]),
    ).toEqual([[Admin, SuperAdmin], [SuperAdmin]])
  })

  it('ignores matches with no staticData at all', () => {
    expect(requiredRolesFor([{}, { staticData: undefined }])).toEqual([])
  })
})

describe('checkAccess', () => {
  it('rejects an anonymous visitor before considering roles', () => {
    expect(checkAccess(null, [])).toBe('unauthenticated')
    expect(checkAccess(null, [[Admin]])).toBe('unauthenticated')
  })

  it('allows any signed-in user when nothing is restricted', () => {
    expect(checkAccess(Admin, [])).toBe('allowed')
  })

  it('allows a permitted role', () => {
    expect(checkAccess(Admin, [[Admin, SuperAdmin]])).toBe('allowed')
  })

  it('forbids a role not on the list', () => {
    expect(checkAccess(Admin, [[SuperAdmin]])).toBe('forbidden')
  })

  // A parent's restriction must keep applying to children, so a child cannot
  // widen access by declaring a longer list.
  it('intersects restrictions down the chain', () => {
    expect(checkAccess(Admin, [[Admin, SuperAdmin], [SuperAdmin]])).toBe(
      'forbidden',
    )
    expect(checkAccess(SuperAdmin, [[Admin, SuperAdmin], [SuperAdmin]])).toBe(
      'allowed',
    )
  })

  // Fails closed: a typo that empties the list must lock everyone out, not
  // let everyone in.
  it('lets nobody through an empty role list', () => {
    expect(checkAccess(SuperAdmin, [[]])).toBe('forbidden')
  })
})
