import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

/**
 * QR decoding for fiscal receipts (ZXing compiled to WebAssembly). Loaded lazily
 * by the scanner, so the decoder never weighs on the main bundle. The .wasm
 * file ships with the app instead of coming from a CDN.
 */

let prepared = false

function ensurePrepared(): void {
  if (prepared) return
  prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
    },
  })
  prepared = true
}

const RECEIPT_HOST = 'suf.purs.gov.rs'

export function isReceiptUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' && url.hostname === RECEIPT_HOST
  } catch {
    return false
  }
}

/** The first QR code in an image or video frame, or null. */
export async function decodeQr(input: Blob | ImageData): Promise<string | null> {
  ensurePrepared()
  const results = await readBarcodes(input, {
    formats: ['QRCode'],
    tryHarder: true,
    maxNumberOfSymbols: 1,
  })
  const found = results.find((result) => result.isValid && result.text)
  return found ? found.text : null
}

/** Grabs the current frame of a playing <video> for decoding. */
export function frameOf(video: HTMLVideoElement, canvas: HTMLCanvasElement): ImageData | null {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return null

  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(video, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}
