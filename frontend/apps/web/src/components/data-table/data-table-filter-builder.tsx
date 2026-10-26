import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@app/ui/components/button'
import { DatePickerField } from '@app/ui/components/fields'
import { cn } from '@app/ui/lib/utils'
import { TOOLBAR_BUTTON_HOVER, TOOLBAR_FIELD_HOVER } from './control-styles'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/ui/components/select'
import type { FilterBuilderConfig } from './types'

interface DataTableFilterButtonProps {
  config: readonly FilterBuilderConfig[]
  filters: Record<string, string>
  open: boolean
  contentId: string
  onOpenChange: (open: boolean) => void
}

const ALL_VALUES = '__all_filter_values__'

export function DataTableFilterButton({
  config,
  filters,
  open,
  contentId,
  onOpenChange,
}: DataTableFilterButtonProps) {
  const { t } = useTranslation()
  const activeFilterCount = config.reduce((count, item) => {
    if (item.type === 'select')
      return count + Number(Boolean(filters[item.key]))
    return (
      count +
      item.operators.filter((operator) => Boolean(filters[operator.key])).length
    )
  }, 0)

  return (
    <Button
      variant={open ? 'secondary' : 'outline'}
      size="sm"
      className={cn('h-8', TOOLBAR_BUTTON_HOVER)}
      aria-expanded={open}
      aria-controls={contentId}
      onClick={() => onOpenChange(!open)}
    >
      <Filter />
      {t('table.filterBuilder.addFilter')}
      {activeFilterCount > 0 && (
        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] text-primary-foreground">
          {activeFilterCount}
        </span>
      )}
    </Button>
  )
}

interface DataTableFilterFieldsProps {
  config: readonly FilterBuilderConfig[]
  filters: Record<string, string>
  setFilter: (key: string, value: string | undefined) => void
  open: boolean
  id: string
}

export function DataTableFilterFields({
  config,
  filters,
  setFilter,
  open,
  id,
}: DataTableFilterFieldsProps) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          id={id}
          data-slot="filter-fields"
          aria-hidden={!open}
          inert={!open ? true : undefined}
          className="grid grid-cols-1 gap-3 border-t p-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {config.flatMap((item) => {
            if (item.type === 'select') {
              return (
                <FilterSelectField
                  key={item.id}
                  label={item.label}
                  value={filters[item.key]}
                  options={item.options}
                  onChange={(value) =>
                    setFilter(
                      item.key,
                      value === ALL_VALUES ? undefined : value,
                    )
                  }
                />
              )
            }

            return item.operators.map((operator) => (
              <FilterDateField
                key={operator.key}
                label={`${item.label} · ${operator.label}`}
                value={filters[operator.key] ?? ''}
                onChange={(value) =>
                  setFilter(operator.key, value || undefined)
                }
              />
            ))
          })}
        </div>
      </div>
    </div>
  )
}

function FilterSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value?: string
  options: readonly { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="min-w-0 space-y-1.5">
      <span className="block text-xs font-medium text-foreground">{label}</span>
      <Select value={value || ALL_VALUES} onValueChange={onChange}>
        <SelectTrigger
          size="sm"
          className={cn('w-full', TOOLBAR_FIELD_HOVER)}
          aria-label={label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUES}>
            {t('table.filterBuilder.all')}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * The date filters use the design system's picker rather than `input[type=date]`.
 * The native control renders differently in every browser, shows the day/month
 * order of the OS locale rather than the app's, and cannot be styled to match
 * the selects beside it.
 *
 * The label is the panel's own `span` rather than the wrapper's `label` prop,
 * so a date filter and a select filter carry identical headings.
 */
function FilterDateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="min-w-0 space-y-1.5">
      <span className="block text-xs font-medium text-foreground">{label}</span>
      <DatePickerField
        value={value}
        onChange={onChange}
        placeholder={t('table.filterBuilder.pickDate')}
        className={cn('gap-0', TOOLBAR_FIELD_HOVER)}
      />
    </div>
  )
}
