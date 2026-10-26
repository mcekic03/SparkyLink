import { RadioGroup, RadioGroupItem } from '@app/ui/components/radio-group'
import { Label } from '@app/ui/components/label'
import { FieldBridge } from './field-bridge'
import type { FieldOption } from './option'
import type { AnyReactFormApi, FieldProps } from './types'

export type RadioGroupFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string
> & {
  options: ReadonlyArray<FieldOption>
  orientation?: 'vertical' | 'horizontal'
}

export function RadioGroupField<TForm extends AnyReactFormApi>({
  options,
  orientation = 'vertical',
  ...field
}: RadioGroupFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string> {...field}>
      {(f) => (
        <RadioGroup
          value={f.value}
          onValueChange={f.setValue}
          disabled={field.disabled}
          aria-invalid={f.isInvalid}
          className={orientation === 'horizontal' ? 'flex gap-4' : 'grid gap-2'}
        >
          {options.map((option) => {
            const itemId = `${f.id}-${option.value}`
            return (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem
                  id={itemId}
                  value={option.value}
                  disabled={option.disabled}
                />
                <Label htmlFor={itemId} className="font-normal">
                  {option.label}
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      )}
    </FieldBridge>
  )
}
