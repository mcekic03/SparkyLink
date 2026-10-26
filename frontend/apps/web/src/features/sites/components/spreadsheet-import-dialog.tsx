import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileSpreadsheetIcon, PlusIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/alert'
import { Button } from '@app/ui/components/button'
import { Checkbox } from '@app/ui/components/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { DatePickerField } from '@app/ui/components/fields'
import { Input } from '@app/ui/components/input'
import { cn } from '@app/ui/lib/utils'
import { getApiErrorMessage } from '#/lib/api-error'
import { todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { formatAmount, formatQuantity } from '#/lib/money'
import { Currency } from '#/types/money'
import { importSpreadsheetItems, readSpreadsheets } from '../api/sites.api'
import { useInvalidateMoney } from '../api/use-site-mutation'
import { importPayload, isRowValid, lineCents, rowsFromFiles, selectedTotal } from '../lib/spreadsheet-import'
import type { SpreadsheetRow } from '../lib/spreadsheet-import'
import type { Site } from '../types'

const ACCEPT = '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface Props {
  site: Site
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Uzastopni redovi jednog fajla, redom kojim su fajlovi pročitani. */
function groupsOf(rows: SpreadsheetRow[]): SpreadsheetRow[][] {
  const groups: SpreadsheetRow[][] = []
  for (const row of rows) {
    const last = groups.at(-1)
    if (last?.[0]?.group === row.group) last.push(row)
    else groups.push([row])
  }
  return groups
}

/**
 * Materijal iz Excel fajlova prodavnice: izbor jednog ili više fajlova, pregled pročitanog
 * (cena iz fajla ide investitoru), pa dodavanje ostavljenih redova kao materijala sa
 * procenjenom nabavnom cenom.
 */
export function SpreadsheetImportDialog({ site, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<SpreadsheetRow[]>([])
  const [problems, setProblems] = useState<Array<{ file: string; error: string }>>([])
  const [filesRead, setFilesRead] = useState(0)
  const [day, setDay] = useState(todayIso())

  const readMutation = useMutation({
    mutationFn: (files: File[]) => readSpreadsheets(site.id, files),
    onSuccess: (data) => {
      setRows((current) => [...current, ...rowsFromFiles(data.files, filesRead)])
      setProblems((current) => [
        ...current,
        ...data.files.flatMap((file) => (file.error ? [{ file: file.name, error: file.error }] : [])),
      ])
      setFilesRead((count) => count + data.files.length)
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Reading spreadsheets failed')
      toast.error(getApiErrorMessage(err, t('items.import.readFailed')))
    },
  })

  const importMutation = useMutation({
    mutationFn: () => importSpreadsheetItems(site.id, importPayload(rows, day)),
    onSuccess: (response) => {
      toast.success(response.message)
      invalidate()
      onOpenChange(false)
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Importing spreadsheet items failed')
      toast.error(getApiErrorMessage(err, t('items.import.saveFailed')))
    },
  })

  const read = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    // Isti fajl može ponovo da se izabere posle greške.
    if (inputRef.current) inputRef.current.value = ''
    if (files.length > 0) readMutation.mutate(files)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    read(event.dataTransfer.files)
  }

  const update = (key: string, patch: Partial<SpreadsheetRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const selected = rows.filter((row) => row.selected)
  const hasInvalid = selected.some((row) => !isRowValid(row))
  const allSelected = rows.length > 0 && rows.every((row) => row.selected)
  const nothingRead = filesRead > 0 && rows.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94svh] overflow-y-auto sm:max-w-2xl" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <DialogHeader>
          <DialogTitle>{t('items.import.title')}</DialogTitle>
          <DialogDescription>{t('items.import.description')}</DialogDescription>
        </DialogHeader>

        <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(event) => read(event.target.files)} />

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center">
            <FileSpreadsheetIcon className="size-8 text-brand-deep" />
            <p className="text-sm text-muted-foreground">{t('items.import.pickHint')}</p>
            <Button onClick={() => inputRef.current?.click()} disabled={readMutation.isPending}>
              {readMutation.isPending ? t('items.import.reading') : t('items.import.pick')}
            </Button>
            <p className="hidden text-xs text-muted-foreground sm:block">{t('items.import.dropHint')}</p>
          </div>
        )}

        {problems.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="space-y-1">
                {problems.map((problem, index) => (
                  <li key={`${problem.file}-${String(index)}`}>
                    <strong>{problem.file}</strong>: {problem.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {nothingRead && problems.length === 0 && <p className="text-sm text-muted-foreground">{t('items.import.empty')}</p>}

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <DatePickerField label={t('items.import.date')} value={day} onChange={setDay} className="w-44" />
              <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={readMutation.isPending}>
                <PlusIcon /> {readMutation.isPending ? t('items.import.reading') : t('items.import.addFiles')}
              </Button>
              <label className="ml-auto flex items-center gap-2 text-sm">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(value) => setRows((current) => current.map((row) => ({ ...row, selected: value === true })))}
                />
                {t('items.import.selectAll')}
              </label>
            </div>

            {groupsOf(rows).map((group) => (
              <section key={group[0]?.group} className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <FileSpreadsheetIcon className="size-4 text-brand-deep" />
                  <span className="truncate">{group[0]?.file}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">{t('items.import.fileItems', { count: group.length })}</span>
                </h3>
                <ul className="divide-y rounded-md border">
                  {group.map((row) => {
                    const cents = lineCents(row)
                    const invalid = row.selected && !isRowValid(row)
                    return (
                      <li key={row.key} className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 p-2.5', !row.selected && 'opacity-60')}>
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={(value) => update(row.key, { selected: value === true })}
                          aria-label={t('items.import.select')}
                          className="mt-2"
                        />
                        <div className="min-w-0 space-y-1.5">
                          <Input
                            value={row.name}
                            onChange={(event) => update(row.key, { name: event.target.value })}
                            aria-invalid={invalid && row.name.trim() === ''}
                            className="h-8"
                          />
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                            <span>
                              {formatQuantity(row.quantity)} {row.unit} ×
                            </span>
                            <label className="flex items-center gap-1.5">
                              <Input
                                value={row.price}
                                onChange={(event) => update(row.key, { price: event.target.value })}
                                inputMode="decimal"
                                aria-label={t('items.import.price')}
                                aria-invalid={invalid}
                                className="h-7 w-24 text-right"
                              />
                              din
                            </label>
                            <span className="ml-auto font-medium text-foreground">
                              {cents === null ? '—' : formatAmount(cents / 100, Currency.RSD)}
                            </span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}

            {hasInvalid && <p className="text-sm text-destructive">{t('items.import.invalid')}</p>}
          </div>
        )}

        <DialogFooter className="flex-wrap items-center gap-2 sm:justify-between">
          {rows.length > 0 ? (
            <p className="text-sm tabular-nums">
              {t('items.import.selected', { count: selected.length, total: formatAmount(selectedTotal(rows), Currency.RSD) })}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={selected.length === 0 || hasInvalid || importMutation.isPending || readMutation.isPending}
            >
              {importMutation.isPending ? t('items.import.importing') : t('items.import.submit', { count: selected.length })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
