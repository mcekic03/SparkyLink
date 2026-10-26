import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Calendar } from '@app/ui/components/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@app/ui/components/popover'
import { cn } from '@app/ui/lib/utils'
import { FieldBridge } from './field-bridge'
import type {
  AnyReactFormApi,
  FieldProps,
  ResolvedField,
} from './types'

/**
 * The value is an ISO `yyyy-mm-dd` string, not a Date.
 *
 * Form values are strings everywhere else, it survives JSON without a timezone
 * shifting the day, and a `Date` here would make the field the only one whose
 * value needs converting before submit.
 */
export type DatePickerFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string
> & {
  placeholder?: string
  /** Formats the trigger label. Defaults to the active locale's short date. */
  format?: (date: Date) => string
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toIsoDay(date: Date): string {
  // Built from local parts, not toISOString(), which shifts to UTC and can
  // land on the previous day west of Greenwich.
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(date.getFullYear())}-${month}-${day}`
}

export function DatePickerField<TForm extends AnyReactFormApi>({
  placeholder = 'Pick a date',
  format,
  ...field
}: DatePickerFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string> {...field}>
      {(resolved) => (
        <DatePickerControl
          field={resolved}
          placeholder={placeholder}
          format={format}
          disabled={field.disabled}
        />
      )}
    </FieldBridge>
  )
}

interface DatePickerControlProps {
  field: ResolvedField<string>
  placeholder: string
  format?: (date: Date) => string
  disabled?: boolean
}

function DatePickerControl({
  field,
  placeholder,
  format,
  disabled,
}: DatePickerControlProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(field.value)
  const label = selected
    ? (format?.(selected) ?? selected.toLocaleDateString())
    : placeholder

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) field.handleBlur()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={field.id}
          type="button"
          variant="outline"
          aria-expanded={open}
          aria-invalid={field.isInvalid}
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 px-3 font-normal',
            !selected && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            field.setValue(date ? toIsoDay(date) : '')
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
