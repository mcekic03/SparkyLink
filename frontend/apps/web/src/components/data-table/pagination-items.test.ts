import { describe, expect, it } from 'vitest'
import { getPageItems, getRowRange } from './pagination-items'

describe('getPageItems', () => {
  it('lists every page while they fit', () => {
    expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('truncates the tail near the start', () => {
    expect(getPageItems(2, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 20])
  })

  it('truncates the head near the end', () => {
    expect(getPageItems(19, 20)).toEqual([
      1,
      'ellipsis-start',
      16,
      17,
      18,
      19,
      20,
    ])
  })

  it('truncates both sides in the middle', () => {
    expect(getPageItems(10, 20)).toEqual([
      1,
      'ellipsis-start',
      9,
      10,
      11,
      'ellipsis-end',
      20,
    ])
  })

  // The control must not resize as you page through it, or the button under the
  // cursor changes between clicks.
  it('keeps a constant width once truncated', () => {
    const widths = new Set(
      range(1, 20).map((page) => getPageItems(page, 20).length),
    )
    expect([...widths]).toEqual([7])
  })

  it('clamps a page beyond the end, as a stale URL can ask for', () => {
    expect(getPageItems(99, 20)).toEqual(getPageItems(20, 20))
  })

  it('handles a single page and an empty result', () => {
    expect(getPageItems(1, 1)).toEqual([1])
    expect(getPageItems(1, 0)).toEqual([1])
  })
})

describe('getRowRange', () => {
  it('describes a full page', () => {
    expect(getRowRange(1, 10, 57)).toEqual({ from: 1, to: 10 })
    expect(getRowRange(2, 10, 57)).toEqual({ from: 11, to: 20 })
  })

  it('stops the last page at the total', () => {
    expect(getRowRange(6, 10, 57)).toEqual({ from: 51, to: 57 })
  })

  it('collapses to zero when there are no rows', () => {
    expect(getRowRange(1, 10, 0)).toEqual({ from: 0, to: 0 })
  })
})

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}
