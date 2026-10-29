import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { PlusIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { FieldGroup } from '@app/ui/components/field'
import { InputField } from '@app/ui/components/fields'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/ui/components/tabs'
import { QueryError } from '#/components/query-error'
import { applyFieldErrors } from '#/components/form/apply-field-errors'
import { getApiErrorMessage, toApiError } from '#/lib/api-error'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { fetchFuseBoards, saveFuseBoard } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import type { FuseBoard, Site } from '../types'
import { fuseBoardNameSchema } from '../validation/fuse-board.schema'
import { FuseBoardEditor } from './fuse-board-editor'

/** Raspored osigurača: podkartica za svaku tablu (ormar) na gradilištu. */
export function FuseBoardsTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<number>()
  const [naming, setNaming] = useState<{ board?: FuseBoard }>()

  const { data: boards, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.fuseBoards(site.id),
    queryFn: () => fetchFuseBoards(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch fuse boards')
  }, [isError, error])

  if (isError) {
    return <QueryError error={error} title={t('fuseBoards.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry fuse boards failed')} />
  }

  const active = boards?.find((board) => board.id === activeId) ?? boards?.[0]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t('fuseBoards.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('fuseBoards.description')}</p>
        </div>
        <Button size="sm" onClick={() => setNaming({})}>
          <PlusIcon /> {t('fuseBoards.newBoard')}
        </Button>
      </div>

      {!boards && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

      {boards?.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('fuseBoards.empty')}</p>
      )}

      {boards && active && (
        <Tabs value={String(active.id)} onValueChange={(value) => setActiveId(Number(value))}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-max">
              {boards.map((board) => (
                <TabsTrigger key={board.id} value={String(board.id)}>
                  {board.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {boards.map((board) => (
            // Sve table ostaju učitane, da nesačuvane izmene ne nestanu pri prelasku na drugu tablu.
            <TabsContent key={board.id} value={String(board.id)} forceMount className="mt-3 data-[state=inactive]:hidden">
              <FuseBoardEditor siteId={site.id} board={board} onRename={() => setNaming({ board })} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {naming && (
        <BoardNameDialog
          siteId={site.id}
          board={naming.board}
          onClose={() => setNaming(undefined)}
          onSaved={(board) => setActiveId(board.id)}
        />
      )}
    </div>
  )
}

interface BoardNameDialogProps {
  siteId: number
  /** Bez table pravi se nova. */
  board?: FuseBoard
  onClose: () => void
  onSaved: (board: FuseBoard) => void
}

/** Nova tabla ili novi naziv postojeće; osigurači se pri tome ne menjaju. */
function BoardNameDialog({ siteId, board, onClose, onSaved }: BoardNameDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (name: string) => saveFuseBoard(siteId, { name }, board?.id),
    onSuccess: (response) => {
      toast.success(response.message ?? '')
      logOnFail(() => queryClient.invalidateQueries({ queryKey: sitesKeys.fuseBoards(siteId) }), 'Invalidate fuse boards failed')
      onSaved(response.data)
      onClose()
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Failed to save fuse board name')
      const unmatched = applyFieldErrors(form, error)
      if (toApiError(error).kind !== 'validation' || unmatched.length > 0) toast.error(getApiErrorMessage(error, t('fuseBoards.saveFailed')))
    },
  })

  const form = useForm({
    defaultValues: { name: board?.name ?? '' },
    validators: { onSubmit: fuseBoardNameSchema(t) },
    onSubmit: ({ value }) => mutation.mutate(value.name.trim()),
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{board ? t('fuseBoards.form.renameTitle') : t('fuseBoards.form.newTitle')}</DialogTitle>
          <DialogDescription>{t('fuseBoards.form.hint')}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            logOnFail(() => form.handleSubmit(), 'Fuse board name submission failed')
          }}
          className="space-y-4"
        >
          <FieldGroup className="gap-3">
            <InputField form={form} name="name" label={t('fuseBoards.form.name')} placeholder={t('fuseBoards.form.namePlaceholder')} />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('common.saving') : t('fuseBoards.form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
