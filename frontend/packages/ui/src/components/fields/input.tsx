import { Input } from '@app/ui/components/input'
import { FieldBridge } from './field-bridge'
import type { ComponentProps } from 'react'
import type { AnyReactFormApi, FieldProps } from './types'

/**
 * A superset of the DOM input types this wrapper supports. `phone` is the one
 * that is not a real input type — it renders `tel`, which is what changes the
 * mobile keyboard.
 */
export type InputType = 'text' | 'number' | 'password' | 'phone' | 'email'

const DOM_TYPE: Record<InputType, ComponentProps<'input'>['type']> = {
  text: 'text',
  number: 'number',
  password: 'password',
  phone: 'tel',
  email: 'email',
}

/**
 * `type` is managed here so it cannot also be set through `inputProps` — two
 * props of the same name at different levels, where the spread silently wins.
 */
type Managed =
  | 'id'
  | 'name'
  | 'type'
  | 'value'
  | 'onChange'
  | 'onBlur'
  | 'aria-invalid'

export type InputFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string
> & {
  type?: InputType
  placeholder?: string
  inputProps?: Omit<ComponentProps<typeof Input>, Managed>
}

export function InputField<TForm extends AnyReactFormApi>({
  type = 'text',
  placeholder,
  inputProps,
  ...field
}: InputFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string> {...field}>
      {(f) => (
        <Input
          id={f.id}
          name={f.name}
          type={DOM_TYPE[type]}
          // A number input still hands back a string; converting here would make
          // the field's value type depend on `type`. Callers parse at the boundary.
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={f.value ?? ''}
          onChange={(e) => f.setValue(e.target.value)}
          onBlur={f.handleBlur}
          aria-invalid={f.isInvalid}
          placeholder={placeholder}
          disabled={field.disabled}
          {...inputProps}
        />
      )}
    </FieldBridge>
  )
}
