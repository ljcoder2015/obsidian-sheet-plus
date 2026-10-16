import type { IWorkbookData } from '@univerjs/core'
import { describe, expect, it } from 'vitest'
import { cellText } from '../src/post-processor/cell-value'

const workbook = {
  id: 'wb',
  sheetOrder: ['s1'],
  styles: {
    money: { n: { pattern: '$#,##0.00' } },
    date: { n: { pattern: 'yyyy-mm-dd' } },
    accounting: { n: { pattern: '"$" #,##0_);[Red]("$"#,##0)' } },
  },
  sheets: {
    s1: {
      id: 's1',
      name: 'Sheet 1',
      cellData: {
        0: {
          0: { v: 'Rent', t: 1 },
          1: { v: 2696.7999999999997, t: 2, f: '=SUM(C2:C7)', s: 'money' },
          2: { v: 46174, t: 2, s: 'date' },
          3: { v: 2696.7999999999997, t: 2 },
          4: { v: -5, t: 2, s: 'accounting' },
          5: { v: 1, t: 3 },
          6: { v: 0.25, t: 2, s: { n: { pattern: '0%' } } },
        },
        27: { 25: { v: 7, t: 2 } },
      },
    },
  },
} as unknown as IWorkbookData

describe('cellText', () => {
  it('shows a text cell as written', () => {
    expect(cellText(workbook, 'Sheet 1', 'A1')).toBe('Rent')
  })

  it('formats a formula\'s saved result with the cell\'s number format', () => {
    expect(cellText(workbook, 'Sheet 1', 'B1')).toBe('$2,696.80')
  })

  it('formats a date with the cell\'s date format', () => {
    expect(cellText(workbook, 'Sheet 1', 'C1')).toBe('2026-06-01')
  })

  it('shows an unformatted number the way the sheet does', () => {
    expect(cellText(workbook, 'Sheet 1', 'D1')).toBe('2696.8')
  })

  it('applies a negative section without its padding', () => {
    expect(cellText(workbook, 'Sheet 1', 'E1')).toBe('($5)')
  })

  it('shows a boolean as TRUE or FALSE', () => {
    expect(cellText(workbook, 'Sheet 1', 'F1')).toBe('TRUE')
  })

  it('reads a style given inline on the cell', () => {
    expect(cellText(workbook, 'Sheet 1', 'G1')).toBe('25%')
  })

  it('reads multi-letter columns and is case-insensitive', () => {
    expect(cellText(workbook, 'Sheet 1', 'z28')).toBe('7')
  })

  it('shows an empty cell as nothing', () => {
    expect(cellText(workbook, 'Sheet 1', 'H9')).toBe('')
  })

  it('uses the first sheet when no sheet is named', () => {
    expect(cellText(workbook, undefined, 'A1')).toBe('Rent')
  })

  it('returns undefined for a sheet that does not exist', () => {
    expect(cellText(workbook, 'Nope', 'A1')).toBeUndefined()
  })
})
