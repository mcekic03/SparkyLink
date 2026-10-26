import { environment } from '#/config/environment'

type DownloadParam = string | number | boolean
type DownloadParamValue =
  DownloadParam | readonly DownloadParam[] | null | undefined

/** Opens an unauthenticated backend download route in a separate window. */
export function openDownload(
  path: `/${string}`,
  params: Readonly<Record<string, DownloadParamValue>> = {},
): void {
  const url = new URL(path, environment.apiUrl)

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue

    const values = Array.isArray(value) ? value : [value]
    for (const item of values) url.searchParams.append(key, String(item))
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
