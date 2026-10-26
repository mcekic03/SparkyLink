import { isAxiosError } from 'axios'

/** Field name → the server's messages for it. Laravel's 422 shape. */
export type FieldErrors = Record<string, string[]>

export type ApiError =
  | { kind: 'network'; status: null; message: string | null }
  | { kind: 'unauthenticated'; status: number; message: string | null }
  | { kind: 'forbidden'; status: number; message: string | null }
  | { kind: 'notFound'; status: number; message: string | null }
  | {
      kind: 'validation'
      status: number
      message: string | null
      fieldErrors: FieldErrors
    }
  | { kind: 'server'; status: number; message: string | null }
  | { kind: 'unknown'; status: number | null; message: string | null }

function readMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return null
  }
  return typeof body.message === 'string' && body.message !== ''
    ? body.message
    : null
}

function readFieldErrors(body: unknown): FieldErrors {
  if (typeof body !== 'object' || body === null || !('errors' in body))
    return {}
  if (typeof body.errors !== 'object' || body.errors === null) return {}

  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(body.errors)) {
    // Laravel sends arrays; tolerate a bare string rather than dropping it.
    if (Array.isArray(messages)) {
      const strings = messages.filter((m): m is string => typeof m === 'string')
      if (strings.length > 0) result[field] = strings
    } else if (typeof messages === 'string') {
      result[field] = [messages]
    }
  }
  return result
}

/**
 * Turns anything thrown by the API layer into a value callers can branch on.
 *
 * The status alone is not enough: a request that never reached the server has
 * no status at all, and "offline" needs a different response from "rejected".
 */
export function toApiError(error: unknown): ApiError {
  // `message` throughout means "server-provided text safe to show a user". A
  // thrown JS Error's message is neither, so it stays null and callers fall
  // back to their own copy.
  if (!isAxiosError(error)) {
    return { kind: 'unknown', status: null, message: null }
  }

  const body: unknown = error.response?.data
  const message = readMessage(body)
  const status = error.response?.status

  if (status === undefined) {
    return { kind: 'network', status: null, message }
  }

  switch (status) {
    case 401:
      return { kind: 'unauthenticated', status, message }
    case 403:
      return { kind: 'forbidden', status, message }
    case 404:
      return { kind: 'notFound', status, message }
    case 422:
      return {
        kind: 'validation',
        status,
        message,
        fieldErrors: readFieldErrors(body),
      }
    default:
      return status >= 500
        ? { kind: 'server', status, message }
        : { kind: 'unknown', status, message }
  }
}

/** Translation key describing a failure, for when the server sends no message. */
export function apiErrorMessageKey(error: ApiError): string {
  return `errors.api.${error.kind}`
}

/**
 * The server's own message where there is one, otherwise the caller's fallback.
 * Prefer `toApiError` when the response should differ by kind.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return toApiError(error).message ?? fallback
}

export function fieldErrorsOf(error: unknown): FieldErrors {
  const parsed = toApiError(error)
  return parsed.kind === 'validation' ? parsed.fieldErrors : {}
}
