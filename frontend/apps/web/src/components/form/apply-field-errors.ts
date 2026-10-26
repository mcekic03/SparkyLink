import { fieldErrorsOf } from '#/lib/api-error'
import type { AnyReactFormApi } from '@app/ui/components/fields'

/**
 * Paints a 422's per-field messages onto the form.
 *
 * Without this a multi-field failure shows one toast and no indication of which
 * fields were rejected — the user has to guess.
 *
 * Returns the fields it could not place, which is the case worth surfacing: the
 * server rejected something the form does not render, so a toast is the only
 * way the user learns about it.
 */
export function applyFieldErrors(
  form: AnyReactFormApi,
  error: unknown,
): string[] {
  const fieldErrors = fieldErrorsOf(error)
  const unmatched: string[] = []

  for (const [field, messages] of Object.entries(fieldErrors)) {
    // readFieldErrors only stores non-empty arrays.
    const message = messages[0]

    if (!(field in form.state.values)) {
      unmatched.push(field)
      continue
    }

    // `FieldError` renders `error.message`, so the entry must be an object —
    // a bare string would turn the field red without showing the server's text.
    form.setFieldMeta(field, (meta) => ({
      ...meta,
      isTouched: true,
      errorMap: { ...meta.errorMap, onServer: { message } },
    }))
  }

  return unmatched
}
