import { Textarea } from '@app/ui/components/textarea'
import { FieldBridge } from './field-bridge'
import type { ComponentProps } from 'react'
import type { AnyReactFormApi, FieldProps } from './types'

type Managed = 'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'aria-invalid'

export type TextareaFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string
> & {
  placeholder?: string
  rows?: number
  textareaProps?: Omit<ComponentProps<typeof Textarea>, Managed>
}

export function TextareaField<TForm extends AnyReactFormApi>({
  placeholder,
  rows,
  textareaProps,
  ...field
}: TextareaFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string> {...field}>
      {(f) => (
        <Textarea
          id={f.id}
          name={f.name}
          rows={rows}
          value={f.value ?? ''}
          onChange={(e) => f.setValue(e.target.value)}
          onBlur={f.handleBlur}
          aria-invalid={f.isInvalid}
          placeholder={placeholder}
          disabled={field.disabled}
          {...textareaProps}
        />
      )}
    </FieldBridge>
  )
}
