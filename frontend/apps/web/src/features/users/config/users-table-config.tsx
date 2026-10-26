import { Link } from '@tanstack/react-router'
import { DataTableColumnHeader } from '#/components/data-table'
import { Checkbox } from '@app/ui/components/checkbox'
import { Badge } from '@app/ui/components/badge'
import { Button } from '@app/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@app/ui/components/tooltip'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { enumOptions } from '#/lib/enum-options'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { DataTableConfig } from '#/components/data-table'
import { UserRole } from '../types'
import type { User } from '../types'

export function usersTableConfig(t: TFunction): DataTableConfig<User> {
  return {
    searchColumn: 'name',
    searchPlaceholder: t('users.searchPlaceholder'),
    enableRowSelection: true,
    enableColumnVisibility: true,
    manualPagination: true,
    manualFiltering: true,
    pinnedRightColumns: ['actions'],
    getRowId: (user) => String(user.id),
    filterBuilder: [
      {
        id: 'role',
        label: t('users.columns.role'),
        type: 'select',
        key: 'role_id',
        options: enumOptions(UserRole, 'users.roles', t).map((option) => ({
          label: option.label,
          value: String(option.value),
        })),
      },
    ],
  }
}

interface UsersColumnActions {
  /** Asks to delete a row. Confirmation and the mutation belong to the page. */
  onDelete: (user: User) => void
}

export function usersColumns(
  t: TFunction,
  { onDelete }: UsersColumnActions,
): ColumnDef<User>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t('table.selectAll')}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t('table.selectRow')}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('users.columns.name')}
        />
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('users.columns.email')}
        />
      ),
    },
    {
      id: 'role',
      accessorKey: 'role_id',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('users.columns.role')}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t(`users.roles.${row.original.role_id}`)}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('users.columns.createdAt')}
        />
      ),
      cell: ({ row }) =>
        new Date(row.getValue('created_at')).toLocaleDateString(),
    },
    {
      id: 'actions',
      // `w-px` collapses the column to its content, so the buttons sit against
      // the right edge instead of floating in a column stretched by the table's
      // leftover width. The heading is read out but not drawn — the word
      // "Actions" is wider than the buttons, and would set the column's width.
      meta: { className: 'w-px text-right' },
      header: () => <span className="sr-only">{t('table.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon-sm">
                <Link
                  to="/users/$userId"
                  params={{ userId: String(row.original.id) }}
                  aria-label={t('common.edit')}
                >
                  <PencilIcon />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
          <ConfirmBubble onConfirm={() => onDelete(row.original)}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t('users.delete.action')}
            >
              <Trash2Icon />
            </Button>
          </ConfirmBubble>
        </div>
      ),
      enableHiding: false,
    },
  ]
}
