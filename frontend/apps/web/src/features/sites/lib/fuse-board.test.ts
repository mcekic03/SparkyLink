import { describe, expect, it } from 'vitest'
import { FuseBoardTemplate, FuseType } from '../types'
import type { FuseBoard } from '../types'
import { boardPayload, isBoardChanged, moveRow, newFuseRow, removeRow, rowsFromBoard, unnamedFuses, updateRow } from './fuse-board'

const board: FuseBoard = {
  id: 3,
  site_id: 4,
  name: 'Razvodni ormar – prizemlje',
  fuses: [
    { number: 1, name: 'Rasveta', type: FuseType.B, rating: 10 },
    { number: 2, name: 'Bojler', type: FuseType.B, rating: 20 },
    { number: 3, name: 'Klima', type: FuseType.C, rating: 16 },
  ],
  pdf_urls: [{ template: FuseBoardTemplate.Table, url: '/api/files/fuse-boards/3/1?signature=x' }],
}

const names = (rows: ReturnType<typeof rowsFromBoard>) => rows.map((row) => row.name)

describe('editing the fuses of a board', () => {
  it('starts with B16 and then repeats the type and rating of the last fuse', () => {
    const first = newFuseRow([])
    const afterKlima = newFuseRow(rowsFromBoard(board))

    expect([first.name, first.type, first.rating]).toEqual(['', FuseType.B, 16])
    expect([afterKlima.name, afterKlima.type, afterKlima.rating]).toEqual(['', FuseType.C, 16])
  })

  it('gives every row its own key, so a moved row keeps what was typed in it', () => {
    const rows = [...rowsFromBoard(board), newFuseRow(rowsFromBoard(board))]

    expect(new Set(rows.map((row) => row.key)).size).toBe(4)
  })

  it('moves a fuse past its neighbour and leaves the first and last in place', () => {
    const rows = rowsFromBoard(board)

    expect(names(moveRow(rows, 2, -1))).toEqual(['Rasveta', 'Klima', 'Bojler'])
    expect(names(moveRow(rows, 0, 1))).toEqual(['Bojler', 'Rasveta', 'Klima'])
    expect(names(moveRow(rows, 0, -1))).toEqual(['Rasveta', 'Bojler', 'Klima'])
    expect(names(moveRow(rows, 2, 1))).toEqual(['Rasveta', 'Bojler', 'Klima'])
  })

  it('closes the gap when a fuse is removed, so the ones below move up a number', () => {
    const payload = boardPayload(board.name, removeRow(rowsFromBoard(board), 0))

    expect(payload.fuses).toEqual([
      { name: 'Bojler', type: FuseType.B, rating: 20 },
      { name: 'Klima', type: FuseType.C, rating: 16 },
    ])
  })

  it('sends trimmed names in board order', () => {
    const rows = updateRow(rowsFromBoard(board), 1, { name: '  Bojler – kupatilo ', rating: 16 })

    expect(boardPayload(' Glavna tabla ', rows)).toEqual({
      name: 'Glavna tabla',
      fuses: [
        { name: 'Rasveta', type: FuseType.B, rating: 10 },
        { name: 'Bojler – kupatilo', type: FuseType.B, rating: 16 },
        { name: 'Klima', type: FuseType.C, rating: 16 },
      ],
    })
  })

  it('knows when the fuses differ from the saved board', () => {
    const rows = rowsFromBoard(board)

    expect(isBoardChanged(board, rows)).toBe(false)
    expect(isBoardChanged(board, updateRow(rows, 0, { name: 'Rasveta ' }))).toBe(false)
    expect(isBoardChanged(board, updateRow(rows, 0, { type: FuseType.C }))).toBe(true)
    expect(isBoardChanged(board, updateRow(rows, 2, { rating: 20 }))).toBe(true)
    expect(isBoardChanged(board, moveRow(rows, 1, 1))).toBe(true)
    expect(isBoardChanged(board, removeRow(rows, 2))).toBe(true)
    expect(isBoardChanged(board, [...rows, newFuseRow(rows)])).toBe(true)
  })

  it('lists the numbers of fuses that still have no name', () => {
    const rows = [...updateRow(rowsFromBoard(board), 1, { name: '   ' }), newFuseRow(rowsFromBoard(board))]

    expect(unnamedFuses(rows)).toEqual([2, 4])
    expect(unnamedFuses(rowsFromBoard(board))).toEqual([])
  })
})
