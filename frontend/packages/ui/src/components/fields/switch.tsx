import { Switch } from '@app/ui/components/switch'
import { FieldBridge } from './field-bridge'
import type { AnyReactFormApi, FieldProps } from './types'

export type SwitchFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  boolean
>

export function SwitchField<TForm extends AnyReactFormApi>(
  props: SwitchFieldProps<TForm>,
) {
  return (
    <FieldBridge<TForm, boolean> {...props}>
      {(f) => (
        <Switch
          id={f.id}
          name={f.name}
          checked={f.value ?? false}
          onCheckedChange={f.setValue}
          onBlur={f.handleBlur}
          aria-invalid={f.isInvalid}
          disabled={props.disabled}
        />
      )}
    </FieldBridge>
  )
}
