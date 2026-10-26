import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlusIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { Input } from '@app/ui/components/input'
import { ConfirmBubble } from '#/components/confirm-bubble'
import { QueryError } from '#/components/query-error'
import { getApiErrorMessage } from '#/lib/api-error'
import { formatDateTime } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { deleteMedia, fetchMedia, updateMediaCaption, uploadMedia } from '../api/sites.api'
import { sitesKeys } from '../api/sites.keys'
import { useDeleteMutation, useInvalidateMoney } from '../api/use-site-mutation'
import { compressImage, isVideo, videoThumbnail } from '../lib/image'
import { MediaType } from '../types'
import type { Site, SiteMedia } from '../types'

const MAX_VIDEO_MB = 512

export function MediaTab({ site }: { site: Site }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ current: number; total: number; fraction: number } | undefined>(undefined)
  const [viewing, setViewing] = useState<SiteMedia | undefined>(undefined)

  const { data: media, isError, error, refetch } = useQuery({
    queryKey: sitesKeys.media(site.id),
    queryFn: () => fetchMedia(site.id),
  })

  useEffect(() => {
    if (isError) logger.error({ err: error }, 'Failed to fetch media')
  }, [isError, error])

  // One file at a time, so each gets its own progress and a failure skips only that file.
  const upload = async (files: File[]) => {
    let uploaded = 0

    // One upload at a time on purpose: separate progress and a failure skips only its own file.
    /* oxlint-disable no-await-in-loop */
    for (const [index, file] of files.entries()) {
      setProgress({ current: index + 1, total: files.length, fraction: 0 })
      try {
        if (isVideo(file)) {
          if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
            toast.error(t('media.tooLarge', { name: file.name, max: MAX_VIDEO_MB }))
            continue
          }
          const thumbnail = await videoThumbnail(file)
          await uploadMedia(site.id, file, file.name, {
            thumbnail,
            takenAt: new Date(file.lastModified).toISOString(),
            onProgress: (fraction) => setProgress({ current: index + 1, total: files.length, fraction }),
          })
        } else {
          const { blob, name } = await compressImage(file)
          await uploadMedia(site.id, blob, name, {
            takenAt: new Date(file.lastModified).toISOString(),
            onProgress: (fraction) => setProgress({ current: index + 1, total: files.length, fraction }),
          })
        }
        uploaded += 1
      } catch (err) {
        logger.error({ err, file: file.name }, 'Uploading a file failed')
        toast.error(getApiErrorMessage(err, t('media.failed', { name: file.name })))
      }
    }

    /* oxlint-enable no-await-in-loop */
    setProgress(undefined)
    if (uploaded > 0) {
      toast.success(t('media.uploaded', { count: uploaded }))
      invalidate()
    }
  }

  if (isError) {
    return <QueryError error={error} title={t('media.loadFailed')} onRetry={() => logOnFail(() => refetch(), 'Retry media failed')} />
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t('media.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('media.description')}</p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={progress !== undefined}>
          <ImagePlusIcon /> {t('media.upload')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            if (files.length > 0) logOnFail(() => upload(files), 'Upload failed')
          }}
        />
      </div>

      {progress && (
        <div className="space-y-1 rounded-md border bg-card p-3">
          <p className="text-sm">{t('media.uploading', { current: progress.current, total: progress.total })}</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${String(Math.round(progress.fraction * 100))}%` }} />
          </div>
        </div>
      )}

      {media && media.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t('media.empty')}</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {media?.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => setViewing(file)}
            className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
          >
            {file.thumbnail_url ? (
              <img src={file.thumbnail_url} alt={file.caption ?? file.original_name} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs text-muted-foreground">{file.original_name}</span>
            )}
            {file.type === MediaType.Video && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-black/60 p-2 text-white">
                  <PlayIcon className="size-5" />
                </span>
              </span>
            )}
            {file.caption && (
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-xs text-white">{file.caption}</span>
            )}
          </button>
        ))}
      </div>

      {viewing && <MediaViewer media={viewing} onClose={() => setViewing(undefined)} />}
    </div>
  )
}

function MediaViewer({ media, onClose }: { media: SiteMedia; onClose: () => void }) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [caption, setCaption] = useState(media.caption ?? '')

  const captionMutation = useMutation({
    mutationFn: () => updateMediaCaption(media.id, caption.trim()),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
    },
    onError: (err: unknown) => {
      logger.error({ err }, 'Saving caption failed')
      toast.error(getApiErrorMessage(err, t('common.saveFailed')))
    },
  })

  const deleteMutation = useDeleteMutation((id: number) => deleteMedia(id), t('media.delete.failed'))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[94svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{media.caption ?? media.original_name}</DialogTitle>
          <DialogDescription>
            {formatDateTime(media.created_at)}
            {media.author ? ` · ${media.author}` : ''}
          </DialogDescription>
        </DialogHeader>
        {media.type === MediaType.Video ? (
          <video src={media.url} controls playsInline className="max-h-[65svh] w-full rounded-md bg-black" />
        ) : (
          <a href={media.url} target="_blank" rel="noreferrer">
            <img src={media.url} alt={media.caption ?? media.original_name} className="max-h-[65svh] w-full rounded-md object-contain" />
          </a>
        )}
        <div className="flex gap-2">
          <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder={t('media.captionPlaceholder')} aria-label={t('media.caption')} />
          <Button variant="outline" onClick={() => captionMutation.mutate()} disabled={captionMutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
        <DialogFooter>
          {media.can_delete && (
            <ConfirmBubble message={t('media.delete.confirm')} onConfirm={() => deleteMutation.mutate(media.id, { onSuccess: onClose })} side="top">
              <Button variant="outline" className="text-destructive">
                <Trash2Icon /> {t('common.delete')}
              </Button>
            </ConfirmBubble>
          )}
          <Button asChild variant="outline">
            <a href={media.url} target="_blank" rel="noreferrer">
              {t('common.open')}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
