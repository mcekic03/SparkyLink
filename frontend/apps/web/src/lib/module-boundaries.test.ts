import { describe, expect, it } from 'vitest'
import { boundaryViolationMessage } from '../../scripts/check-module-boundaries'

describe('module boundaries', () => {
  it('rejects imports between features', () => {
    expect(
      boundaryViolationMessage(
        'src/features/users/pages/users.page.tsx',
        '#/features/auth/auth-context',
      ),
    ).toMatch(/feature "users" cannot import feature "auth"/)
  })

  it('allows imports within a feature', () => {
    expect(
      boundaryViolationMessage(
        'src/features/users/pages/users.page.tsx',
        '#/features/users/api/users.api',
      ),
    ).toBeNull()
  })

  it('rejects feature imports from shared layers', () => {
    expect(
      boundaryViolationMessage(
        'src/components/sidebar/nav-user.tsx',
        '#/features/auth/auth-context',
      ),
    ).toMatch(/shared layer "components" cannot import feature "auth"/)
  })

  it('also checks relative imports', () => {
    expect(
      boundaryViolationMessage(
        'src/lib/session.ts',
        '../features/auth/auth-context',
      ),
    ).toMatch(/shared layer "lib" cannot import feature "auth"/)
  })
})
