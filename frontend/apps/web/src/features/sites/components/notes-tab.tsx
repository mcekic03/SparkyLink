import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Textarea } from '@app/ui/components/textarea'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { getApiErrorMessage } from '#/lib/api-error'
import { formatDateTime } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { deleteNote, fetchNotes, saveNote } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import type { Site, SiteNote } from '../types'

export function NotesTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<{ id: number; body: string } | undefined>(undefined)

  const { data: notes, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.notes(site.id),
    queryFn: () => fetchNotes(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch notes')
  }, [isError, error])

  const saveMutation = useMutation({
    mutationFn: ({ body, id }: { body: string; id?: number }) => saveNote(site.id, body, id),
    onSuccess: (response, variables) => {
      if (response.message) toast.success(response.message)
      if (variables.id) setEditing(undefined)
      else setDraft('')
      invalidate()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Saving note failed')
      toast.error(getApiErrorMessage(err, t('notes.saveFailed')))
    },
  })

  const deleteMutation = useDeleteMutation((id: number) => deleteNote(id), t('notes.delete.failed'))

  if (isError) {
    return <QueryError error={error} title={t('notes.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry notes failed')} />
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">{t('notes.title')}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (draft.trim()) saveMutation.mutate({ body: draft.trim() })
        }}
        className="space-y-2"
      >
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('notes.placeholder')} rows={3} />
        <Button type="submit" size="sm" disabled={saveMutation.isPending || draft.trim() === ''}>
          {t('notes.add')}
        </Button>
      </form>

      {notes && notes.length === 0 && <p className="text-sm text-muted-foreground">{t('notes.empty')}</p>}

      <ul className="space-y-2">
        {notes?.map((note: SiteNote) => (
          <li key={note.id} className="rounded-lg border bg-card p-3">
            {editing?.id === note.id ? (
              <div className="space-y-2">
                <Textarea value={editing.body} onChange={(event) => setEditing({ id: note.id, body: event.target.value })} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveMutation.mutate({ body: editing.body.trim(), id: note.id })} disabled={saveMutation.isPending}>
                    {t('common.save')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(undefined)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-line">{note.body}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {note.author ?? ''} · {formatDateTime(note.created_at)}
                  </span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing({ id: note.id, body: note.body })} aria-label={t('common.edit')}>
                      <PencilIcon />
                    </Button>
                    <ConfirmBubble message={t('notes.delete.confirm')} onConfirm={() => deleteMutation.mutate(note.id)}>
                      <Button variant="ghost" size="icon-sm" className="hover:text-destructive" aria-label={t('common.delete')}>
                        <Trash2Icon />
                      </Button>
                    </ConfirmBubble>
                  </span>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
