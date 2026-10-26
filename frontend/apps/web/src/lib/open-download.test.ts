import { afterEach, describe, expect, it, vi } from 'vitest'
import { environment } from '#/config/environment'
import { openDownload } from './open-download'

afterEach(() => vi.unstubAllGlobals())

describe('openDownload', () => {
  it('opens a backend route with scalar query parameters', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    openDownload('/api/users/export', { name: 'Ada Lovelace', role_id: 2 })

    expect(open).toHaveBeenCalledWith(
      new URL(
        `${environment.apiUrl}/api/users/export?name=Ada+Lovelace&role_id=2`,
      ),
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('omits empty values while preserving false', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    openDownload('/api/users/export', {
      name: '',
      role_id: undefined,
      archived: false,
    })

    expect(open).toHaveBeenCalledWith(
      new URL(`${environment.apiUrl}/api/users/export?archived=false`),
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('repeats array parameters', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })

    openDownload('/api/users/export', { role_id: [1, 2] })

    expect(open.mock.calls[0]?.[0].searchParams.getAll('role_id')).toEqual([
      '1',
      '2',
    ])
  })
})
