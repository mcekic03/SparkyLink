import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CameraIcon, ImageIcon, LinkIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@app/ui/components/alert'
import { Button } from '@app/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@app/ui/components/dialog'
import { Input } from '@app/ui/components/input'
import { getApiErrorMessage } from '#/lib/api-error'
import { formatDateTime, todayIso } from '#/lib/format'
import { logger } from '#/lib/logger'
import { logOnFail } from '#/lib/log-on-fail'
import { formatAmount } from '#/lib/money'
import { Currency } from '#/types/money'
import { previewReceipt, storeReceipt } from '../api/sites.api'
import { useInvalidateMoney } from '../api/use-site-mutation'
import { compressImage } from '../lib/image'
import type { ReceiptPreview, Site } from '../types'
import { ReceiptItemsEditor, rowsFrom, selectedItems } from './receipt-items-editor'
import type { EditableRow } from './receipt-items-editor'

type Step = 'scan' | 'preview' | 'manual'

interface Props {
  site: Site
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Live camera needs a secure context (HTTPS or localhost) and a camera API. */
function cameraAvailable(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && 'mediaDevices' in navigator && typeof navigator.mediaDevices.getUserMedia === 'function'
}

export function ReceiptScannerDialog({ site, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const invalidate = useInvalidateMoney()
  const [step, setStep] = useState<Step>('scan')
  const [qrUrl, setQrUrl] = useState('')
  const [pasted, setPasted] = useState('')
  const [photo, setPhoto] = useState<Blob | undefined>(undefined)
  const [preview, setPreview] = useState<ReceiptPreview | undefined>(undefined)
  const [rows, setRows] = useState<EditableRow[]>([])
  const [markup, setMarkup] = useState('')
  const [problem, setProblem] = useState<string | undefined>(undefined)
  const [decoding, setDecoding] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [manual, setManual] = useState({ note: '', store: '', date: todayIso() })
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const previewMutation = useMutation({
    mutationFn: (url: string) => previewReceipt(site.id, url),
    onSuccess: (data) => {
      setPreview(data)
      setRows(rowsFrom(data.receipt?.items ?? []))
      setMarkup((data.markup_percent ?? site.effective_markup_percent ?? '20').replace('.', ','))
      setStep('preview')
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Receipt preview failed')
      setProblem(getApiErrorMessage(error, t('receipts.previewFailed')))
    },
  })

  const storeMutation = useMutation({
    mutationFn: (payload: Parameters<typeof storeReceipt>[1]) => storeReceipt(site.id, payload),
    onSuccess: (response) => {
      if (response.message) toast.success(response.message)
      invalidate()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      logger.error({ err: error }, 'Saving receipt failed')
      toast.error(getApiErrorMessage(error, t('receipts.saveFailed')))
    },
  })

  const handleUrl = (url: string) => {
    setProblem(undefined)
    setQrUrl(url)
    previewMutation.mutate(url)
  }

  // Live camera: decode a frame every half second until a receipt QR shows up.
  useEffect(() => {
    if (!cameraOn) return () => undefined
    let stream: MediaStream | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    let stopped = false
    const canvas = document.createElement('canvas')

    const start = async () => {
      try {
        const qr = await import('../lib/qr')
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        const video = videoRef.current
        if (!video || stopped) return
        video.srcObject = stream
        await video.play()

        timer = setInterval(() => {
          const frame = qr.frameOf(video, canvas)
          if (!frame) return
          logOnFail(async () => {
            const text = await qr.decodeQr(frame)
            if (!text || stopped) return
            if (qr.isReceiptUrl(text)) {
              setCameraOn(false)
              handleUrl(text)
            } else {
              setProblem(t('receipts.scanner.notReceipt'))
            }
          }, 'Decoding a camera frame failed')
        }, 500)
      } catch (error) {
        logger.error({ err: error }, 'Camera failed')
        setProblem(t('receipts.scanner.cameraFailed'))
        setCameraOn(false)
      }
    }

    logOnFail(start, 'Starting the camera failed')

    return () => {
      stopped = true
      if (timer) clearInterval(timer)
      for (const track of stream?.getTracks() ?? []) track.stop()
    }
    // handleUrl/t are stable enough for the lifetime of one scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn])

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setProblem(undefined)
    setDecoding(true)
    try {
      const compressed = await compressImage(file)
      setPhoto(compressed.blob)
      const qr = await import('../lib/qr')
      // The original, full-resolution file reads far more reliably than the shrunk copy.
      const text = (await qr.decodeQr(file)) ?? (await qr.decodeQr(compressed.blob))
      if (text && qr.isReceiptUrl(text)) {
        handleUrl(text)
      } else {
        setProblem(text ? t('receipts.scanner.notReceipt') : t('receipts.scanner.noQr'))
      }
    } catch (error) {
      logger.error({ err: error }, 'Reading the receipt photo failed')
      setProblem(t('receipts.scanner.noQr'))
    } finally {
      setDecoding(false)
    }
  }

  const busy = decoding || previewMutation.isPending || storeMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{step === 'preview' ? t('receipts.preview.title') : t('receipts.scanner.title')}</DialogTitle>
          <DialogDescription>{site.name}</DialogDescription>
        </DialogHeader>

        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('receipts.scanner.description')}</p>

            {cameraOn && (
              <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full rounded-lg bg-black object-cover sm:aspect-video" />
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              {cameraAvailable() && (
                <Button type="button" variant={cameraOn ? 'secondary' : 'default'} onClick={() => setCameraOn((on) => !on)} disabled={busy}>
                  <CameraIcon /> {t('receipts.scanner.camera')}
                </Button>
              )}
              <Button type="button" variant={cameraAvailable() ? 'outline' : 'default'} onClick={() => photoInputRef.current?.click()} disabled={busy}>
                <CameraIcon /> {t('receipts.scanner.takePhoto')}
              </Button>
              <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={busy}>
                <ImageIcon /> {t('receipts.scanner.choosePhoto')}
              </Button>
            </div>
            {!cameraAvailable() && <p className="text-xs text-muted-foreground">{t('receipts.scanner.cameraHint')}</p>}

            <input ref={photoInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => logOnFail(() => onPhoto(event.target.files?.[0]), 'Receipt photo failed')} />
            <input ref={galleryInputRef} type="file" accept="image/*" hidden onChange={(event) => logOnFail(() => onPhoto(event.target.files?.[0]), 'Receipt image failed')} />

            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <LinkIcon className="size-4" /> {t('receipts.scanner.pasteLink')}
              </p>
              <div className="flex gap-2">
                <Input value={pasted} onChange={(event) => setPasted(event.target.value)} placeholder={t('receipts.scanner.pasteLinkPlaceholder')} />
                <Button type="button" onClick={() => handleUrl(pasted.trim())} disabled={busy || pasted.trim() === ''}>
                  {t('receipts.scanner.fetch')}
                </Button>
              </div>
            </div>

            {(decoding || previewMutation.isPending) && (
              <p className="text-sm text-muted-foreground">
                {decoding ? t('receipts.scanner.decoding') : t('receipts.scanner.fetching')}
              </p>
            )}

            {problem && (
              <Alert variant="destructive">
                <AlertDescription className="space-y-2">
                  <p>{problem}</p>
                  {photo && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setStep('manual')}>
                      {t('receipts.scanner.saveOnlyPhoto')}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
            {preview.fetched && preview.receipt ? (
              <>
                <div className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{preview.receipt.store_name}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(preview.receipt.issued_at)} · {t('receipts.preview.total')}:{' '}
                    {formatAmount(preview.receipt.total_amount, Currency.RSD)}
                  </span>
                </div>
                <ReceiptItemsEditor rows={rows} onChange={setRows} markup={markup} onMarkupChange={setMarkup} />
              </>
            ) : (
              <Alert>
                <AlertDescription>{t('receipts.preview.notFetched')}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-3">
            <label className="grid gap-1 text-sm">
              {t('receipts.scanner.manualStore')}
              <Input value={manual.store} onChange={(event) => setManual({ ...manual, store: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              {t('receipts.scanner.manualDate')}
              <Input type="date" value={manual.date} onChange={(event) => setManual({ ...manual, date: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              {t('receipts.scanner.manualNote')}
              <Input value={manual.note} onChange={(event) => setManual({ ...manual, note: event.target.value })} />
            </label>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => (step === 'scan' ? onOpenChange(false) : setStep('scan'))}>
            {step === 'scan' ? t('common.cancel') : t('common.back')}
          </Button>
          {step === 'preview' && preview?.fetched && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => storeMutation.mutate({ qrUrl, items: selectedItems(rows), photo })}
            >
              {storeMutation.isPending ? t('receipts.preview.importing') : t('receipts.preview.import')}
            </Button>
          )}
          {step === 'preview' && preview && !preview.fetched && (
            <Button type="button" disabled={busy} onClick={() => storeMutation.mutate({ qrUrl, photo })}>
              {t('receipts.preview.saveWaiting')}
            </Button>
          )}
          {step === 'manual' && (
            <Button
              type="button"
              disabled={busy || !photo}
              onClick={() =>
                storeMutation.mutate({
                  photo,
                  note: manual.note.trim() || undefined,
                  storeName: manual.store.trim() || undefined,
                  issuedAt: manual.date || undefined,
                })
              }
            >
              {t('receipts.scanner.saveOnlyPhoto')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
