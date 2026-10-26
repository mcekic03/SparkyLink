import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@app/ui/lib/utils'
import { Checkbox } from '@app/ui/components/checkbox'
import { ScrollArea } from '@app/ui/components/scroll-area'
import type { FilterConfig, ParsedFilterState } from './types'

interface DataTableFilterSidebarProps {
  filters: FilterConfig[]
  filterState: ParsedFilterState
  onToggleFilterValue: (columnId: string, value: string) => void
  className?: string
}

function MultiSelectFilterGroup({
  filter,
  selectedValues,
  onToggle,
}: {
  filter: Extract<FilterConfig, { type: 'multi-select' }>
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  const [open, setOpen] = useState(filter.defaultOpen ?? true)

  return (
    <div className="border-b pb-3">
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-sm font-medium"
        onClick={() => setOpen(!open)}
      >
        {filter.label}
        {selectedValues.length > 0 && (
          <span className="bg-primary text-primary-foreground ml-auto mr-2 inline-flex size-5 items-center justify-center rounded-full text-xs">
            {selectedValues.length}
          </span>
        )}
        {open ? (
          <ChevronDown className="text-muted-foreground size-4" />
        ) : (
          <ChevronRight className="text-muted-foreground size-4" />
        )}
      </button>
      {open && (
        <div className="space-y-2 pt-1">
          {filter.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              {option.icon && <option.icon />}
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function DataTableFilterSidebar({
  filters,
  filterState,
  onToggleFilterValue,
  className,
}: DataTableFilterSidebarProps) {
  const { t } = useTranslation()
  const multiSelectFilters = filters.filter(
    (f): f is Extract<FilterConfig, { type: 'multi-select' }> =>
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- guard for future filter types
      f.type === 'multi-select',
  )

  if (multiSelectFilters.length === 0) return null

  return (
    <div className={cn('space-y-1', className)}>
      <div className="mb-3 text-sm font-semibold">{t('table.filters')}</div>
      <ScrollArea>
        <div className="space-y-1">
          {multiSelectFilters.map((filter) => (
            <MultiSelectFilterGroup
              key={filter.columnId}
              filter={filter}
              selectedValues={filterState.multiSelect[filter.columnId] ?? []}
              onToggle={(value) => onToggleFilterValue(filter.columnId, value)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
