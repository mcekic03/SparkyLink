import { useTranslation } from 'react-i18next'
import { Button } from '@app/ui/components/button'
import { Checkbox } from '@app/ui/components/checkbox'
import { Input } from '@app/ui/components/input'
import { formatAmount, formatQuantity, normalizeDecimal } from '#/lib/money'
import { Currency } from '#/types/money'
import type { ImportItem, PreviewItem } from '../types'

export interface EditableRow extends PreviewItem {
  selected: boolean
}

export function rowsFrom(items: PreviewItem[]): EditableRow[] {
  return items.map((item) => ({ ...item, sale_price: item.sale_price.replace('.', ','), selected: true }))
}

/** Rows the user kept, in the shape the API imports. */
export function selectedItems(rows: EditableRow[]): ImportItem[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => ({
      type: row.type,
      name: row.name.trim(),
      unit: row.unit,
      quantity: row.quantity,
      purchase_price: row.purchase_price,
      sale_price: normalizeDecimal(row.sale_price) ?? row.purchase_price,
      is_billable: row.is_billable,
    }))
}

interface Props {
  rows: EditableRow[]
  onChange: (rows: EditableRow[]) => void
  markup: string
  onMarkupChange: (markup: string) => void
}

/** Receipt lines with a checkbox each, an editable name and an editable price for the investor. */
export function ReceiptItemsEditor({ rows, onChange, markup, onMarkupChange }: Props) {
  const { t } = useTranslation()
  const allSelected = rows.every((row) => row.selected)

  const update = (index: number, patch: Partial<EditableRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  const applyMarkup = () => {
    const factor = 1 + Number(normalizeDecimal(markup) ?? 0) / 100
    onChange(
      rows.map((row) => ({
        ...row,
        sale_price: String(Math.round(Number(row.purchase_price) * factor * 100) / 100).replace('.', ','),
      })),
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">{t('receipts.preview.markup')}</span>
          <Input value={markup} onChange={(event) => onMarkupChange(event.target.value)} inputMode="decimal" className="h-8 w-24" />
        </label>
        <Button type="button" size="sm" variant="outline" onClick={applyMarkup}>
          {t('receipts.preview.applyMarkup')}
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <Checkbox checked={allSelected} onCheckedChange={(value) => onChange(rows.map((row) => ({ ...row, selected: value === true })))} />
          {t('receipts.preview.selectAll')}
        </label>
      </div>

      <ul className="divide-y rounded-md border">
        {rows.map((row, index) => (
          <li key={`${row.name}-${String(index)}`} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 p-2.5">
            <Checkbox
              checked={row.selected}
              onCheckedChange={(value) => update(index, { selected: value === true })}
              aria-label={t('receipts.preview.select')}
              className="mt-2"
            />
            <div className="min-w-0 space-y-1.5">
              <Input value={row.name} onChange={(event) => update(index, { name: event.target.value })} className="h-8" />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                <span>
                  {formatQuantity(row.quantity)} {row.unit} × {formatAmount(row.purchase_price, Currency.RSD)}
                </span>
                <label className="flex items-center gap-1.5">
                  {t('receipts.preview.sale')}
                  <Input
                    value={row.sale_price}
                    onChange={(event) => update(index, { sale_price: event.target.value })}
                    inputMode="decimal"
                    className="h-7 w-24 text-right"
                  />
                  din
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t('receipts.preview.selected', { count: rows.filter((row) => row.selected).length })}</p>
    </div>
  )
}
