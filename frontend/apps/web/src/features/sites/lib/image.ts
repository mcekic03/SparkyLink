/**
 * Photos from a phone are 4–12 MB; shrinking them in the browser before upload
 * makes uploading from a site on mobile data bearable. Videos are not touched
 * (the browser cannot re-encode them), but get a poster frame as a thumbnail.
 */

const MAX_SIDE = 2560
const QUALITY = 0.85

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image could not be decoded'))
    }
    image.src = url
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

/**
 * JPEG at most 2560 px on the long side. Falls back to the original file when
 * the browser cannot decode it (e.g. HEIC on desktop) or it is already small.
 */
export async function compressImage(file: File): Promise<{ blob: Blob; name: string }> {
  try {
    const image = await loadImage(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))

    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      return { blob: file, name: file.name }
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await canvasToJpeg(canvas, QUALITY)
    if (!blob || blob.size >= file.size) return { blob: file, name: file.name }

    return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' }
  } catch {
    return { blob: file, name: file.name }
  }
}

/** First frame (at ~1 s) of a video as a JPEG, or undefined when it cannot be read. */
export function videoThumbnail(file: File): Promise<Blob | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    const done = (blob: Blob | undefined) => {
      URL.revokeObjectURL(url)
      resolve(blob)
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2)
    }
    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight))
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => done(blob ?? undefined), 'image/jpeg', 0.8)
    }
    video.onerror = () => done(undefined)
    setTimeout(() => done(undefined), 8000)
    video.src = url
  })
}

export function isVideo(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name)
}
