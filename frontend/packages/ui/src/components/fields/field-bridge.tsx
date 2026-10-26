import { useId } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@app/ui/components/field'
import { isBound } from './types'
import type {
  AnyReactFormApi,
  FieldProps,
  FieldRenderer,
  ResolvedField,
} from './types'

/**
 * Normalises the two modes — bound to a TanStack Form, or plain controlled
 * props — into one shape, then renders the label, description and error chrome
 * around whichever primitive the caller supplies.
 *
 * `form.Field` is a component rather than a hook, so this has to be a render
 * prop; a hook could not switch between the two.
 */
export function FieldBridge<TForm extends AnyReactFormApi, TValue>(
  props: FieldProps<TForm, TValue> & { children: FieldRenderer<TValue> },
) {
  const { label, description, className, children } = props
  const generatedId = useId()

  function chrome(field: ResolvedField<TValue>) {
    return (
      <Field className={className ?? 'gap-1'} data-invalid={field.isInvalid}>
        {label !== undefined && (
          <FieldLabel htmlFor={field.id}>{label}</FieldLabel>
        )}
        {children(field)}
        {description !== undefined && (
          <FieldDescription>{description}</FieldDescription>
        )}
        {field.isInvalid && field.errors.length > 0 && (
          <FieldError errors={field.errors} />
        )}
      </Field>
    )
  }

  if (isBound<TForm, TValue>(props)) {
    const { form, name } = props
    return (
      <form.Field name={name}>
        {(field: {
          name: string
          state: {
            value: TValue
            meta: {
              isTouched: boolean
              isValid: boolean
              errors: Array<{ message?: string } | undefined>
            }
          }
          handleBlur: () => void
          handleChange: (value: TValue) => void
        }) =>
          chrome({
            id: field.name,
            name: field.name,
            value: field.state.value,
            setValue: field.handleChange,
            handleBlur: field.handleBlur,
            isInvalid: field.state.meta.isTouched && !field.state.meta.isValid,
            errors: field.state.meta.errors,
          })
        }
      </form.Field>
    )
  }

  const { name, value, onChange, onBlur, error } = props
  return chrome({
    id: name ?? generatedId,
    name: name ?? generatedId,
    value,
    setValue: onChange,
    handleBlur: onBlur ?? (() => undefined),
    isInvalid: error !== undefined,
    errors: error === undefined ? [] : [{ message: error }],
  })
}
