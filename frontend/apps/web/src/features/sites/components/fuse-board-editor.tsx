import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDownIcon, ArrowUpIcon, FileTextIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Input } from '@app/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/ui/components/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@app/ui/components/tooltip'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { useUnsavedChanges } from '#/components/unsaved-changes'
import { getApiErrorMessage } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { deleteFuseBoard, saveFuseBoard } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import cardsPreview from '../assets/fuse-templates/cards.webp'
import drawingPreview from '../assets/fuse-templates/drawing.webp'
import railPreview from '../assets/fuse-templates/rail.webp'
import tablePreview from '../assets/fuse-templates/table.webp'
import { boardPayload, isBoardChanged, moveRow, newFuseRow, removeRow, rowsFromBoard, unnamedFuses, updateRow } from '../lib/fuse-board'
import type { FuseRow } from '../lib/fuse-board'
import { FUSE_RATINGS, FuseBoardTemplate, FuseType } from '../types'
import type { FuseBoard } from '../types'

/** Izgled svakog PDF-a (šablon sa probnim podacima), prikazuje se kad se mišem pređe preko dugmeta. */
const TEMPLATE_PREVIEWS: Record<FuseBoardTemplate, string> = {
  [FuseBoardTemplate.Table]: tablePreview,
  [FuseBoardTemplate.Rail]: railPreview,
  [FuseBoardTemplate.Cards]: cardsPreview,
  [FuseBoardTemplate.Drawing]: drawingPreview,
}

interface Props {
  siteId: number
  board: FuseBoard
  onRename: () => void
}

/** Spisak osigurača jedne table: menja se na miru, pa se čuva odjednom; PDF uvek prati sačuvano. */
export function FuseBoardEditor({ siteId, board, onRename }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(board)
  const [rows, setRows] = useState(() => rowsFromBoard(board))
  const [focusKey, setFocusKey] = useState<string>()
  const [showErrors, setShowErrors] = useState(false)

  // Tabla stigla sa servera (posle čuvanja ili novog naziva) zamenjuje spisak, osim ako u njemu ima nesačuvanih izmena.
  if (board !== saved) {
    setSaved(board)
    if (!isBoardChanged(saved, rows)) setRows(rowsFromBoard(board))
  }

  const changed = isBoardChanged(board, rows)
  const unnamed = unnamedFuses(rows)
  useUnsavedChanges(changed)

  const refresh = () =>
    logOnFail(() => queryClient.invalidateQueries({ queryKey: sitesKeys.fuseBoards(siteId) }), 'Invalidate fuse boards failed')

  const saveMutation = useMutation({
    mutationFn: () => saveFuseBoard(siteId, boardPayload(board.name, rows), board.id),
    onSuccess: (response) => {
      toast.success(response.message ?? '')
      setShowErrors(false)
      refresh()
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save fuse board')
      toast.error(getApiErrorMessage(error, t('fuseBoards.saveFailed')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFuseBoard(board.id),
    onSuccess: (response) => {
      toast.success(response.message)
      refresh()
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to delete fuse board')
      toast.error(getApiErrorMessage(error, t('fuseBoards.delete.failed')))
    },
  })

  const save = () => {
    if (unnamed.length > 0) {
      setShowErrors(true)
      return
    }
    saveMutation.mutate()
  }

  const addFuse = () => {
    const row = newFuseRow(rows)
    setRows([...rows, row])
    setFocusKey(row.key)
  }

  const pdfReady = !changed && board.fuses.length > 0
  const pdfHint = changed ? t('fuseBoards.pdf.unsaved') : board.fuses.length === 0 ? t('fuseBoards.pdf.noFuses') : t('fuseBoards.pdf.hint')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{board.name}</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onRename}>
            <PencilIcon /> {t('fuseBoards.rename')}
          </Button>
          <ConfirmBubble message={t('fuseBoards.delete.confirm')} onConfirm={() => deleteMutation.mutate()}>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={t('fuseBoards.delete.action')}>
              <Trash2Icon />
            </Button>
          </ConfirmBubble>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('fuseBoards.fuses.empty')}</p>
      ) : (
        <ol className="divide-y rounded-lg border bg-card">
          {rows.map((row, index) => (
            <FuseRowEditor
              key={row.key}
              row={row}
              number={index + 1}
              isLast={index === rows.length - 1}
              autoFocus={row.key === focusKey}
              invalid={showErrors && row.name.trim() === ''}
              onChange={(patch) => setRows(updateRow(rows, index, patch))}
              onMove={(offset) => setRows(moveRow(rows, index, offset))}
              onRemove={() => setRows(removeRow(rows, index))}
              onEnter={() => index === rows.length - 1 && addFuse()}
            />
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addFuse}>
          <PlusIcon /> {t('fuseBoards.fuses.add')}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">{t('fuseBoards.fuses.count', { count: rows.length })}</span>
        <div className="ml-auto flex gap-2">
          {changed && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setRows(rowsFromBoard(board))
                setShowErrors(false)
              }}
            >
              {t('fuseBoards.reset')}
            </Button>
          )}
          <Button type="button" size="sm" onClick={save} disabled={!changed || saveMutation.isPending}>
            {saveMutation.isPending ? t('common.saving') : t('fuseBoards.save')}
          </Button>
        </div>
      </div>

      {showErrors && unnamed.length > 0 && (
        <p className="text-sm text-destructive">{t('fuseBoards.fuses.unnamed', { numbers: unnamed.join(', ') })}</p>
      )}

      <section className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t('fuseBoards.pdf.title')}</span>
          {board.pdf_urls.map(({ template, url }) => (
            <Tooltip key={template}>
              <TooltipTrigger asChild>
                {/* Omotač, da se izgled vidi i dok je dugme isključeno. */}
                <span className="inline-flex">
                  {pdfReady ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={url} target="_blank" rel="noreferrer">
                        <FileTextIcon /> {t(`fuseBoards.templates.${template}`)}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      <FileTextIcon /> {t(`fuseBoards.templates.${template}`)}
                    </Button>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-none p-1.5">
                <img
                  src={TEMPLATE_PREVIEWS[template]}
                  alt={t(`fuseBoards.templates.${template}`)}
                  width={360}
                  height={243}
                  className="block rounded-sm bg-white"
                />
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{pdfHint}</p>
      </section>
    </div>
  )
}

interface FuseRowEditorProps {
  row: FuseRow
  number: number
  isLast: boolean
  autoFocus: boolean
  invalid: boolean
  onChange: (patch: Partial<Omit<FuseRow, 'key'>>) => void
  onMove: (offset: -1 | 1) => void
  onRemove: () => void
  onEnter: () => void
}

function FuseRowEditor({ row, number, isLast, autoFocus, invalid, onChange, onMove, onRemove, onEnter }: FuseRowEditorProps) {
  const { t } = useTranslation()

  return (
    <li className="grid grid-cols-[2rem_1fr] items-center gap-2 p-2 sm:grid-cols-[2rem_1fr_auto]">
      <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold tabular-nums">{number}</span>
      <Input
        value={row.name}
        onChange={(event) => onChange({ name: event.target.value })}
        onKeyDown={(event) => {
          // Enter u poslednjem redu odmah dodaje sledeći osigurač.
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            onEnter()
          }
        }}
        placeholder={t('fuseBoards.fuses.namePlaceholder')}
        aria-label={t('fuseBoards.fuses.name')}
        aria-invalid={invalid}
        autoFocus={autoFocus}
        className="h-9"
      />
      <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
        <Select
          value={String(row.rating)}
          onValueChange={(value) => onChange({ rating: FUSE_RATINGS.find((rating) => String(rating) === value) ?? row.rating })}
        >
          <SelectTrigger size="sm" className="w-24" aria-label={t('fuseBoards.fuses.rating')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUSE_RATINGS.map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {rating} A
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(row.type)} onValueChange={(value) => onChange({ type: value === String(FuseType.C) ? FuseType.C : FuseType.B })}>
          <SelectTrigger size="sm" className="w-20" aria-label={t('fuseBoards.fuses.type')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(FuseType.B)}>B</SelectItem>
            <SelectItem value={String(FuseType.C)}>C</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={number === 1} aria-label={t('fuseBoards.fuses.moveUp')}>
            <ArrowUpIcon />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={isLast} aria-label={t('fuseBoards.fuses.moveDown')}>
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={t('fuseBoards.fuses.remove')}
          >
            <XIcon />
          </Button>
        </div>
      </div>
    </li>
  )
}
