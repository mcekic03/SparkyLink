import { useState } from 'react'
import { ChevronsUpDownIcon, XIcon } from 'lucide-react'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@app/ui/components/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@app/ui/components/popover'
import { FieldBridge } from './field-bridge'
import type { FieldOption } from './option'
import type {
  AnyReactFormApi,
  FieldProps,
  ResolvedField,
} from './types'

export type MultiSelectFieldProps<TForm extends AnyReactFormApi> = FieldProps<
  TForm,
  string[]
> & {
  options: ReadonlyArray<FieldOption>
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function MultiSelectField<TForm extends AnyReactFormApi>({
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results.',
  ...field
}: MultiSelectFieldProps<TForm>) {
  return (
    <FieldBridge<TForm, string[]> {...field}>
      {(resolved) => (
        <MultiSelectControl
          field={resolved}
          options={options}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          disabled={field.disabled}
        />
      )}
    </FieldBridge>
  )
}

interface MultiSelectControlProps {
  field: ResolvedField<string[]>
  options: ReadonlyArray<FieldOption>
  placeholder: string
  searchPlaceholder: string
  emptyMessage: string
  disabled?: boolean
}

function MultiSelectControl({
  field,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
}: MultiSelectControlProps) {
  const [open, setOpen] = useState(false)
  const selected = field.value ?? []
  const chosen = options.filter((option) => selected.includes(option.value))

  function toggle(value: string) {
    field.setValue(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    )
  }

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
          role="combobox"
          aria-expanded={open}
          aria-invalid={field.isInvalid}
          disabled={disabled}
          className="h-auto min-h-9 w-full justify-between gap-3 px-3 py-1.5 font-normal"
        >
          <span className="flex min-w-0 flex-wrap gap-1">
            {chosen.length === 0 ? (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {chosen.slice(0, 2).map((option) => (
                  <Badge key={option.value} variant="secondary">
                    {option.label}
                  </Badge>
                ))}
                {chosen.length > 2 && (
                  <Badge variant="outline">+{chosen.length - 2}</Badge>
                )}
              </>
            )}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} autoFocus />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    className="cursor-pointer"
                    disabled={option.disabled}
                    data-checked={checked}
                    aria-checked={checked}
                    onSelect={() => toggle(option.value)}
                  >
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t border-border/70 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center text-muted-foreground"
                onClick={() => field.setValue([])}
              >
                <XIcon className="size-4" />
                Clear selection
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
