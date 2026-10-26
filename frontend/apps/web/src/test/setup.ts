import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { server } from './msw/server'
import { installWebStorage } from './web-storage'

// Tests default to the `node` environment; only files that render opt into
// a DOM. See CLAUDE.md — "Tests — node by default, a DOM only when rendering".
const hasDom = typeof document !== 'undefined'

if (!hasDom) installWebStorage()

let cleanupDom: (() => void) | undefined

if (hasDom) {
  await import('@testing-library/jest-dom/vitest')
  const { cleanup } = await import('@testing-library/react')
  cleanupDom = cleanup

  // An uninitialised i18next returns the raw key. Pinned to `en` rather than
  // left to detection, which would read the host's locale.
  const { i18n } = await import('#/lib/i18n')
  await i18n.changeLanguage('en')
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterAll(() => {
  server.close()
})

// Fail tests on console.error — React reports bad props and act() violations
// through it. Three traps that silently weaken this guard:
//   - vi.spyOn in beforeAll is torn down by restoreMocks before every test.
//     Hence direct assignment in beforeEach.
//   - Throwing inline is swallowed by whichever library called console.error.
//     Hence recording, then throwing in afterEach.
//   - afterEach hooks run in reverse order, so a separate afterEach(cleanup)
//     is skipped once this one throws, leaving the next test a dirty DOM.
//     Hence unmounting here, first.
const realConsoleError = console.error
let captured: Array<ReadonlyArray<unknown>> = []

beforeEach(() => {
  captured = []
  console.error = (...args: ReadonlyArray<unknown>) => {
    realConsoleError(...args)
    captured.push(args)
  }
})

afterEach(() => {
  cleanupDom?.()
  console.error = realConsoleError
  server.resetHandlers()

  if (captured.length > 0) {
    const count = captured.length
    captured = []
    throw new Error(
      `console.error was called ${count} time(s) during this test — see the output above. ` +
        'If it is genuinely expected, assert on it with a local spy instead.',
    )
  }
})
