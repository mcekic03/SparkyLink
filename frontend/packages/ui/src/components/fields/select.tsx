import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/select'
import { FieldBridge } from './field-bridge'
import type { FieldOption } from './option'
import type { AnyReactFormApi, FieldProps } from './types'

export type SelectFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string
> & {
  options: ReadonlyArray<FieldOption>
  placeholder?: string
}

export function SelectField<TForm extends AnyReactFormApi>({
  options,
  placeholder,
  ...field
}: SelectFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string> {...field}>
      {(f) => (
        <Select
          name={f.name}
          value={f.value}
          onValueChange={f.setValue}
          onOpenChange={(open) => !open && f.handleBlur()}
          disabled={field.disabled}
        >
          <SelectTrigger
            id={f.id}
            aria-invalid={f.isInvalid}
            onBlur={f.handleBlur}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FieldBridge>
  )
}
