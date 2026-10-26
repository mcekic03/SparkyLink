import type { ReactNode } from 'react'
import type {
  DeepKeys,
  FormApi,
  ReactFormExtendedApi,
} from '@tanstack/react-form'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A loosely-typed form API that any `useForm()` return value satisfies, so
 * callers never spell out twelve type parameters.
 */
export type AnyReactFormApi = ReactFormExtendedApi<
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>

/** Extracts `TFormData` from a form instance, to constrain `name` to real paths. */
export type FormData<TForm> =
  TForm extends FormApi<
    infer D,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? D
    : never

export interface FieldChrome {
  label?: string
  description?: string
  className?: string
  disabled?: boolean
}

/** Bound to a TanStack Form instance. */
export interface BoundField<TForm extends AnyReactFormApi> {
  form: TForm
  name: DeepKeys<FormData<TForm>>
}

/** Controlled by the caller, with no form involved. */
export interface StandaloneField<TValue> {
  name?: string
  value: TValue
  onChange: (value: TValue) => void
  onBlur?: () => void
  /** Renders the field as invalid. */
  error?: string
}

export type FieldProps<TForm extends AnyReactFormApi, TValue> = FieldChrome &
  (BoundField<TForm> | StandaloneField<TValue>)

/** What every wrapper renders against, whichever mode it was given. */
export interface ResolvedField<TValue> {
  id: string
  name: string
  value: TValue
  setValue: (value: TValue) => void
  handleBlur: () => void
  isInvalid: boolean
  errors: Array<{ message?: string } | undefined>
}

export type FieldRenderer<TValue> = (
  field: ResolvedField<TValue>,
) => ReactNode

export function isBound<TForm extends AnyReactFormApi, TValue>(
  props: FieldProps<TForm, TValue>,
): props is FieldChrome & BoundField<TForm> {
  return 'form' in props
}
