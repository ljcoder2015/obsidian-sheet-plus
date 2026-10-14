import type { IWorkbookData } from '@univerjs/core'
import { LocaleType } from '@univerjs/core'
import { describe, expect, it } from 'vitest'
import { evaluateEmbedFormula } from '../src/post-processor/formula'

function workbook(): IWorkbookData {
  return {
    id: 'wb1',
    name: 'Budget.univer.md',
    appVersion: '1.0.4',
    locale: LocaleType.EN_US,
    styles: {},
    sheetOrder: ['s1', 's2'],
    sheets: {
      s1: { id: 's1', name: 'Sheet1', rowCount: 30, columnCount: 10, cellData: { 0: { 0: { v: 5 } } } },
      s2: {
        id: 's2',
        name: 'Sheet 2',
        rowCount: 30,
        columnCount: 10,
        cellData: {
          8: { 5: { v: 1 } },
          9: { 5: { v: 2 } },
          10: { 5: { f: '=F9*10', v: 20 } },
          11: { 5: { f: '=Sheet1!A1*100' } },
        },
      },
    },
  } as unknown as IWorkbookData
}

describe('evaluateEmbedFormula', () => {
  it('sums a range on the named sheet using current formula values', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '=SUM(F9:F12)')).toEqual({ ok: true, kind: 'scalar', value: 513 })
  })

  it('defaults to the first sheet', async () => {
    expect(await evaluateEmbedFormula(workbook(), undefined, '=A1')).toEqual({ ok: true, kind: 'scalar', value: 5 })
  })

  it('follows references to other sheets', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '=Sheet1!A1+1')).toEqual({ ok: true, kind: 'scalar', value: 6 })
  })

  it('returns spreadsheet errors as values', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '=1/0')).toEqual({ ok: true, kind: 'scalar', value: '#DIV/0!' })
  })

  it('returns array literals as rows', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '={1,2;3,4}')).toEqual({ ok: true, kind: 'array', rows: [[1, 2], [3, 4]] })
  })

  it('reports a missing sheet without starting the engine', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Nope', '=1')).toEqual({ ok: false, reason: 'sheet-not-found', detail: 'Nope' })
  })

  it('reports unparseable input as an invalid formula', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '=SUM(')).toEqual({ ok: false, reason: 'invalid-formula' })
  })

  it('falls back to the first sheet key when sheetOrder is missing', async () => {
    const data = workbook()
    delete (data as Partial<IWorkbookData>).sheetOrder
    expect(await evaluateEmbedFormula(data, undefined, '=A1')).toEqual({ ok: true, kind: 'scalar', value: 5 })
  })

  it('times out instead of hanging', async () => {
    expect(await evaluateEmbedFormula(workbook(), 'Sheet 2', '=SUM(F9:F12)', 0)).toEqual({ ok: false, reason: 'timeout' })
  })

  it('does not modify the workbook data it is given', async () => {
    const data = workbook()
    const before = structuredClone(data)
    await evaluateEmbedFormula(data, 'Sheet 2', '=SUM(F9:F12)')
    expect(data).toEqual(before)
  })
})
