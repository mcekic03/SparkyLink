import { Link } from '@tanstack/react-router'
import { DataTableColumnHeader } from '#/components/data-table'
import { DualAmount } from '#/components/dual-amount'
import { formatDay } from '#/lib/format'
import { formatAmount } from '#/lib/money'
import { otherCurrency } from '#/types/money'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { DataTableConfig } from '#/components/data-table'
import { PaymentStatusBadge, SiteStatusBadge } from '../components/status-badges'
import { PaymentStatus, SiteStatus } from '../types'
import type { Site } from '../types'

export function sitesTableConfig(t: TFunction): DataTableConfig<Site> {
  return {
    searchColumn: 'name',
    searchPlaceholder: t('sites.searchPlaceholder'),
    manualPagination: true,
    manualFiltering: true,
    getRowId: (site) => String(site.id),
    filterBuilder: [
      {
        id: 'status',
        label: t('sites.filters.status'),
        type: 'select',
        key: 'status',
        options: [SiteStatus.Offer, SiteStatus.Open, SiteStatus.Closed].map((status) => ({
          label: t(`sites.status.${status}`),
          value: String(status),
        })),
      },
      {
        id: 'payment_status',
        label: t('sites.filters.paymentStatus'),
        type: 'select' as const,
        key: 'payment_status',
        options: [PaymentStatus.Unpaid, PaymentStatus.PartiallyPaid, PaymentStatus.Paid].map((status) => ({
          label: t(`sites.paymentStatus.${status}`),
          value: String(status),
        })),
      },
    ],
  }
}

export function sitesColumns(t: TFunction): ColumnDef<Site>[] {
  const columns: ColumnDef<Site>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('sites.columns.name')} />,
      cell: ({ row }) => (
        <Link
          to="/gradilista/$siteId"
          params={{ siteId: String(row.original.id) }}
          className="block min-w-48 py-1 font-medium hover:underline"
        >
          {row.original.name}
          <span className="block text-xs font-normal text-muted-foreground">
            {[row.original.address, row.original.city].filter(Boolean).join(', ')}
          </span>
        </Link>
      ),
    },
    {
      id: 'investor',
      accessorKey: 'investor_name',
      header: () => t('sites.columns.investor'),
      cell: ({ row }) => (
        <span className="block min-w-36">
          {row.original.investor_name ?? t('common.none')}
          {row.original.investor_phone && (
            <a href={`tel:${row.original.investor_phone}`} className="block text-xs text-muted-foreground hover:underline">
              {row.original.investor_phone}
            </a>
          )}
        </span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => t('sites.columns.status'),
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <SiteStatusBadge status={row.original.status} />
          {row.original.financials && row.original.status !== SiteStatus.Offer && (
            <PaymentStatusBadge status={row.original.financials.payment_status} />
          )}
        </div>
      ),
    },
  ]

  columns.push(
    {
      id: 'balance',
      header: () => t('sites.columns.balance'),
      meta: { className: 'text-right' },
      cell: ({ row }) => {
        const balance = row.original.financials?.balance
        if (!balance || row.original.status === SiteStatus.Offer) return null
        return (
          <span className="inline-flex flex-col items-end leading-tight tabular-nums">
            <span className="font-medium">{formatAmount(balance.amount, balance.currency)}</span>
          </span>
        )
      },
    },
    {
      id: 'profit',
      header: () => t('sites.columns.profit'),
      meta: { className: 'text-right' },
      cell: ({ row }) =>
        row.original.financials ? (
          <DualAmount pair={row.original.financials.profit} primary={row.original.currency} signed className="items-end" />
        ) : null,
    },
  )

  columns.push({
    accessorKey: 'started_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title={t('sites.columns.started')} />,
    cell: ({ row }) => formatDay(row.original.started_at),
  })

  return columns
}

/** The other currency of a site, for compact cells that show only one. */
export function siteOtherCurrency(site: Site) {
  return otherCurrency(site.currency)
}
