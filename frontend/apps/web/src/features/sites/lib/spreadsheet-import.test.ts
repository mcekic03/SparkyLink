import { describe, expect, it } from 'vitest'
import { importPayload, isRowValid, lineCents, rowsFromFiles, selectedTotal } from './spreadsheet-import'

const files = [
  {
    name: 'ponuda.xls',
    error: null,
    items: [
      { name: 'Rns klema 16', unit: 'kom', quantity: '2', unit_price: '700.00', total: '1400.00' },
      { name: 'Pgp 3x2.5', unit: 'm', quantity: '12.5', unit_price: '170.50', total: '2131.25' },
    ],
  },
  { name: 'spisak.xlsx', error: 'Nema tabele', items: [] },
  {
    name: 'ponuda.xls',
    error: null,
    items: [{ name: 'Dozna f60', unit: 'kom', quantity: '30', unit_price: '15.00', total: '450.00' }],
  },
]

describe('spreadsheet import rows', () => {
  it('keeps every row selected, with its file and a price written the Serbian way', () => {
    const rows = rowsFromFiles(files)

    expect(rows.map((row) => [row.file, row.group, row.name, row.price, row.selected])).toEqual([
      ['ponuda.xls', 0, 'Rns klema 16', '700,00', true],
      ['ponuda.xls', 0, 'Pgp 3x2.5', '170,50', true],
      ['ponuda.xls', 2, 'Dozna f60', '15,00', true],
    ])
    expect(new Set(rows.map((row) => row.key)).size).toBe(3)
  })

  it('numbers groups after the files read earlier, so a second batch never merges with the first', () => {
    const rows = rowsFromFiles(files.slice(0, 1), 3)

    expect(rows.map((row) => row.group)).toEqual([3, 3])
    expect(rows[0]?.key).not.toBe(rowsFromFiles(files.slice(0, 1))[0]?.key)
  })

  it('totals the selected rows in whole cents', () => {
    const [klema, kabl, dozna] = rowsFromFiles(files)

    expect(selectedTotal([klema, kabl, dozna])).toBe(3981.25)
    expect(selectedTotal([klema, kabl, { ...dozna, selected: false }])).toBe(3531.25)
    expect(lineCents({ quantity: '0.1', price: '0,3' })).toBe(3)
    expect(lineCents({ quantity: '2', price: 'abc' })).toBeNull()
  })

  it('sends only the kept rows per file, trimmed, with the price as the API reads it', () => {
    const [klema, kabl, dozna] = rowsFromFiles(files)
    const rows = [{ ...klema, name: '  Rns klema 16  ', price: '1.234,50' }, { ...kabl, selected: false }, dozna]

    // Isto ime fajla dva puta su ipak dva uvoza.
    expect(importPayload(rows, '2026-10-20')).toEqual({
      occurred_at: '2026-10-20',
      files: [
        { name: 'ponuda.xls', items: [{ name: 'Rns klema 16', unit: 'kom', quantity: '2', sale_price: '1234.50' }] },
        { name: 'ponuda.xls', items: [{ name: 'Dozna f60', unit: 'kom', quantity: '30', sale_price: '15.00' }] },
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
