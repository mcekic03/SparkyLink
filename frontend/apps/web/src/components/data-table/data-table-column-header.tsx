import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@app/ui/lib/utils'
import { Button } from '@app/ui/components/button'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-1 size-4" />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-1 size-4" />
      ) : (
        <ChevronsUpDown className="ml-1 size-4" />
      )}
    </Button>
  )
}
