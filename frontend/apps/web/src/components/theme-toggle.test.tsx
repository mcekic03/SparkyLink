/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from './theme-toggle'

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

afterEach(() => {
  // next-themes writes the choice through, and the class it set outlives the
  // unmounted tree — the next test would start in whatever the last one left.
  localStorage.clear()
  document.documentElement.classList.remove('dark', 'light')
  delete (document as Partial<Document>).startViewTransition
})

/**
 * happy-dom has no View Transitions API, so every other test here exercises the
 * fallback. This stub is the only way to cover the path real Chromium and
 * Safari take — including that the update actually runs inside the callback,
 * which is what `flushSync` in the helper is there to guarantee.
 */
function transitionStub(): ViewTransition {
  return {
    ready: Promise.resolve(),
    finished: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: () => undefined,
    types: new Set<string>(),
  }
}

function stubViewTransitions() {
  const startViewTransition = vi.fn((update: () => void) => {
    update()
    return transitionStub()
  })

  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    writable: true,
    value: startViewTransition,
  })

  return startViewTransition
}

describe('ThemeToggle', () => {
  it('switches the document between light and dark', async () => {
    renderToggle()
    const button = screen.getByRole('button', { name: 'Toggle theme' })

    await userEvent.click(button)
    expect(document.documentElement).toHaveClass('dark')

    await userEvent.click(button)
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('shows the icon for the theme it would switch to', async () => {
    const { container } = renderToggle()

    expect(container.querySelector('.lucide-sun')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
    expect(container.querySelector('.lucide-moon')).toBeVisible()
  })

  // The icon animates only once it has been painted, so the header does not
  // spin itself into view on load.
  it('does not animate on first paint, only on a change', async () => {
    const { container } = renderToggle()

    expect(container.querySelector('svg')).not.toHaveClass('animate-in')
    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
    expect(container.querySelector('svg')).toHaveClass('animate-in')
  })

  it('switches through a view transition when the browser has one', async () => {
    const startViewTransition = stubViewTransitions()
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(document.documentElement).toHaveClass('dark')
  })

  // The browser captures the "after" frame the moment the callback returns. If
  // React were still holding the update in a batch, the transition would
  // capture two identical frames and cross-fade nothing.
  it('applies the theme before the transition callback returns', async () => {
    let classDuringCallback = ''
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      writable: true,
      value: (update: () => void) => {
        update()
        classDuringCallback = document.documentElement.className
        return transitionStub()
      },
    })

    renderToggle()
    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))

    expect(classDuringCallback).toContain('dark')
  })

  it('still switches in a browser without the API', async () => {
    expect('startViewTransition' in document).toBe(false)
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }))
    expect(document.documentElement).toHaveClass('dark')
  })

  // An enter animation replays only when the element is mounted afresh. Render
  // one icon component with a changing prop instead and it plays once, then
  // never again — so assert the node itself is replaced on every switch.
  it('remounts the icon on each switch, not just the first', async () => {
    const { container } = renderToggle()
    const button = screen.getByRole('button', { name: 'Toggle theme' })

    const first = container.querySelector('svg')
    await userEvent.click(button)
    const second = container.querySelector('svg')
    await userEvent.click(button)
    const third = container.querySelector('svg')

    expect(second).not.toBe(first)
    expect(third).not.toBe(second)
    expect(third).toHaveClass('animate-in')
  })
})
