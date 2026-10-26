/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitcher } from './language-switcher'
import { i18n } from '#/lib/i18n'

afterEach(async () => {
  // i18next is a module singleton and `isolate: false` shares it across files
  // in a worker, so a test that leaves the app in Serbian breaks whichever test
  // runs next and asserts on English copy.
  //
  // Unmount first: switching language re-renders everything reading a
  // translation, and with the tree still mounted that update lands outside
  // React's act, which the console.error guard turns into a failure of the
  // *next* test. RTL's own cleanup runs after this hook, not before it.
  cleanup()
  await i18n.changeLanguage('en')
})

describe('LanguageSwitcher', () => {
  it('marks the active language and switches to another', async () => {
    render(<LanguageSwitcher />)

    await userEvent.click(screen.getByRole('button', { name: 'Language' }))

    const english = await screen.findByRole('menuitemradio', {
      name: 'English',
    })
    const serbian = screen.getByRole('menuitemradio', { name: 'Srpski' })
    expect(english).toBeChecked()
    expect(serbian).not.toBeChecked()

    await userEvent.click(serbian)

    // Assert on the rendered copy rather than on i18next's state: the trigger's
    // label is itself translated, so finding it in Serbian proves the change
    // reached the UI. `findBy` also settles the re-render inside act.
    expect(await screen.findByRole('button', { name: 'Jezik' })).toBeVisible()
    expect(i18n.language).toBe('sr')
  })

  it('names each language in words, with the flag as decoration only', async () => {
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('button', { name: 'Language' }))
    await screen.findByRole('menuitemradio', { name: 'English' })

    // `alt=""` keeps the flag out of the accessible name — the row is already
    // called "English", and "United Kingdom flag English" is noise. It also
    // means the images are not exposed as `img` roles at all, so they have to
    // be queried out of the DOM directly.
    const flags = document.querySelectorAll('img')
    expect(flags).toHaveLength(2)
    for (const flag of flags) {
      expect(flag).toHaveAttribute('alt', '')
    }
  })
})
