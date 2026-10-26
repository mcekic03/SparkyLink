import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { fieldErrorsOf, getApiErrorMessage, toApiError } from './api-error'

function axiosError(status: number | undefined, data?: unknown) {
  const error = new AxiosError('Request failed')
  if (status !== undefined) {
    error.response = {
      status,
      statusText: '',
      data,
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    }
  }
  return error
}

describe('toApiError', () => {
  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [422, 'validation'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ])('maps %i to %s', (status, kind) => {
    expect(toApiError(axiosError(status)).kind).toBe(kind)
  })

  // A request that never reached the server has no status at all, and "offline"
  // warrants a different response from "rejected".
  it('maps a response-less failure to network', () => {
    const parsed = toApiError(axiosError(undefined))
    expect(parsed.kind).toBe('network')
    expect(parsed.status).toBeNull()
  })

  it('treats a non-axios throw as unknown', () => {
    expect(toApiError(new Error('boom')).kind).toBe('unknown')
  })

  it('carries the server message through', () => {
    expect(
      toApiError(axiosError(404, { message: 'No such user' })).message,
    ).toBe('No such user')
  })

  it('ignores a non-string or empty message', () => {
    expect(toApiError(axiosError(500, { message: '' })).message).toBeNull()
    expect(toApiError(axiosError(500, { message: 42 })).message).toBeNull()
  })
})

describe('field errors', () => {
  it('extracts Laravel-shaped 422 errors', () => {
    const error = axiosError(422, {
      message: 'Validation failed',
      errors: { email: ['Already taken'], name: ['Too short', 'No digits'] },
    })

    expect(fieldErrorsOf(error)).toEqual({
      email: ['Already taken'],
      name: ['Too short', 'No digits'],
    })
  })

  it('tolerates a bare string instead of an array', () => {
    expect(
      fieldErrorsOf(axiosError(422, { errors: { email: 'Already taken' } })),
    ).toEqual({ email: ['Already taken'] })
  })

  it('drops entries with no usable message', () => {
    expect(
      fieldErrorsOf(axiosError(422, { errors: { email: [], name: [42] } })),
    ).toEqual({})
  })

  it('returns nothing for a non-validation failure', () => {
    expect(fieldErrorsOf(axiosError(500, { errors: { a: ['x'] } }))).toEqual({})
  })
})

describe('getApiErrorMessage', () => {
  it('prefers the server message', () => {
    expect(
      getApiErrorMessage(axiosError(400, { message: 'Bad input' }), 'fallback'),
    ).toBe('Bad input')
  })

  // A raw JS error message is not safe to show a user.
  it('falls back for a non-axios throw', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })

  it('falls back when the body carries no message', () => {
    expect(getApiErrorMessage(axiosError(500, {}), 'fallback')).toBe('fallback')
  })
})
