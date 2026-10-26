/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Button } from '@app/ui/components/button'
import { getApiErrorMessage } from '#/lib/api-error'
import { server } from './msw/server'

describe('test harness', () => {
  it('renders into jsdom via Testing Library', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeVisible()
  })

  it('resolves the #/ and @app/ui path aliases', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })

  it('intercepts HTTP through MSW', async () => {
    server.use(
      http.get('https://example.test/ping', () =>
        HttpResponse.json({ ok: true }),
      ),
    )

    const response = await fetch('https://example.test/ping')
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
