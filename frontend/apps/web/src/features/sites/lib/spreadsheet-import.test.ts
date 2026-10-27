import { describe, expect, it } from 'vitest'
import type { SpreadsheetFile } from '../types'
import { groupsFromFiles, importPayload, isRowValid, lineCents, rowMatch, rowsFromFiles, selectedTotal } from './spreadsheet-import'

const earlier = {
  import_id: 7,
  file_name: 'ponuda.xls',
  created_at: '2026-10-26T13:44:00Z',
  same: 1,
  changed: 1,
  new: 0,
  missing: 3,
  rows: [
    { status: 'same' as const, item_id: 11, previous: null },
    { status: 'changed' as const, item_id: 12, previous: { quantity: '10.000', unit: 'm', sale_price: '160.00' } },
  ],
}

const files: SpreadsheetFile[] = [
  {
    name: 'ponuda.xls',
    error: null,
    candidates: [earlier],
    suggested_import_id: 7,
    items: [
      { name: 'Rns klema 16', unit: 'kom', quantity: '2', unit_price: '700.00', total: '1400.00' },
      { name: 'Pgp 3x2.5', unit: 'm', quantity: '12.5', unit_price: '170.50', total: '2131.25' },
    ],
  },
  { name: 'spisak.xlsx', error: 'Nema tabele', candidates: [], suggested_import_id: null, items: [] },
  {
    name: 'ponuda.xls',
    error: null,
    candidates: [],
    suggested_import_id: null,
    items: [{ name: 'Dozna f60', unit: 'kom', quantity: '30', unit_price: '15.00', total: '450.00' }],
  },
]

describe('spreadsheet import rows', () => {
  it('keeps every row selected, with its file, its line and a price written the Serbian way', () => {
    const rows = rowsFromFiles(files)

    expect(rows.map((row) => [row.file, row.group, row.line, row.name, row.price, row.selected])).toEqual([
      ['ponuda.xls', 0, 0, 'Rns klema 16', '700,00', true],
      ['ponuda.xls', 0, 1, 'Pgp 3x2.5', '170,50', true],
      ['ponuda.xls', 2, 0, 'Dozna f60', '15,00', true],
    ])
    expect(new Set(rows.map((row) => row.key)).size).toBe(3)
  })

  it('numbers groups after the files read earlier, so a second batch never merges with the first', () => {
    const rows = rowsFromFiles(files.slice(0, 1), 3)

    expect(rows.map((row) => row.group)).toEqual([3, 3])
    expect(rows[0]?.key).not.toBe(rowsFromFiles(files.slice(0, 1))[0]?.key)
    expect(groupsFromFiles(files.slice(0, 1), 3)).toEqual([{ group: 3, name: 'ponuda.xls', candidates: [earlier], suggested: 7 }])
  })

  it('totals the selected rows in whole cents', () => {
    const [klema, kabl, dozna] = rowsFromFiles(files)

    expect(selectedTotal([klema, kabl, dozna])).toBe(3981.25)
    expect(selectedTotal([klema, kabl, { ...dozna, selected: false }])).toBe(3531.25)
    expect(lineCents({ quantity: '0.1', price: '0,3' })).toBe(3)
    expect(lineCents({ quantity: '2', price: 'abc' })).toBeNull()
  })

  it('shows each row against the chosen earlier import, and everything as new for a new document', () => {
    const [group] = groupsFromFiles(files)
    const [klema, kabl] = rowsFromFiles(files)

    expect(rowMatch(klema, group, 7).status).toBe('same')
    expect(rowMatch(kabl, group, 7)).toEqual({ status: 'changed', previous: { quantity: '10.000', unit: 'm', sale_price: '160.00' } })
    expect(rowMatch(kabl, group, null).status).toBe('new')
    expect(rowMatch(kabl, group, 99).status).toBe('new')
  })

  it('sends only the kept rows per file, trimmed, with the price as the API reads it', () => {
    const [klema, kabl, dozna] = rowsFromFiles(files)
    const rows = [{ ...klema, name: '  Rns klema 16  ', price: '1.234,50' }, { ...kabl, selected: false }, dozna]

    // Isto ime fajla dva puta su ipak dva dokumenta; prvi je nova verzija ranijeg uvoza.
    expect(importPayload(rows, '2026-10-20', new Map([[0, 7], [2, null]]))).toEqual({
      occurred_at: '2026-10-20',
      files: [
        { name: 'ponuda.xls', merge_into: 7, items: [{ name: 'Rns klema 16', unit: 'kom', quantity: '2', sale_price: '1234.50' }] },
        { name: 'ponuda.xls', merge_into: null, items: [{ name: 'Dozna f60', unit: 'kom', quantity: '30', sale_price: '15.00' }] },
      ],
    })
  })

  it('leaves out a file whose rows were all unticked', () => {
    const [klema, kabl, dozna] = rowsFromFiles(files)

    expect(importPayload([klema, kabl, { ...dozna, selected: false }], '2026-10-20').files).toHaveLength(1)
  })

  it('needs a name and a price that is a number', () => {
    const [row] = rowsFromFiles(files)

    expect(isRowValid(row)).toBe(true)
    expect(isRowValid({ ...row, name: '  ' })).toBe(false)
    expect(isRowValid({ ...row, price: '' })).toBe(false)
    expect(isRowValid({ ...row, price: '-5' })).toBe(false)
  })
})
