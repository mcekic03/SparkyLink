/**
 * Page-number window for the pagination control.
 *
 * The list is a fixed width once it truncates — first page, last page, the
 * current page with `siblings` either side, and an ellipsis wherever that
 * leaves a gap. A fixed width matters: a control that grows and shrinks as you
 * page through moves the next/previous buttons under the cursor.
 */
export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export function getPageItems(
  page: number,
  pageCount: number,
  siblings = 1,
): PageItem[] {
  if (pageCount <= 1) return [1]

  // first + last + current + both ellipses + the siblings either side.
  const windowSize = 5 + siblings * 2
  if (pageCount <= windowSize) return range(1, pageCount)

  const current = Math.min(Math.max(page, 1), pageCount)
  const showStartEllipsis = current - siblings > 2
  const showEndEllipsis = current + siblings < pageCount - 1

  if (!showStartEllipsis && showEndEllipsis) {
    return [...range(1, windowSize - 2), 'ellipsis-end', pageCount]
  }

  if (showStartEllipsis && !showEndEllipsis) {
    return [
      1,
      'ellipsis-start',
      ...range(pageCount - windowSize + 3, pageCount),
    ]
  }

  return [
    1,
    'ellipsis-start',
    ...range(current - siblings, current + siblings),
    'ellipsis-end',
    pageCount,
  ]
}

/** Inclusive 1-based row range shown on the current page, for "1–10 of 57". */
export function getRowRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 }
  const from = (page - 1) * pageSize + 1
  return { from: Math.min(from, total), to: Math.min(page * pageSize, total) }
}
