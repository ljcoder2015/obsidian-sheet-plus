import type { IWorkbookData } from '@univerjs/core'
import { describe, expect, it, vi } from 'vitest'
import { evaluateEmbedFormula } from '../src/post-processor/formula'
import { createFormulaUniver } from '../src/post-processor/formula-univer'

vi.mock('../src/post-processor/formula-univer', () => ({ createFormulaUniver: vi.fn() }))

const data = {
  id: 'wb1',
  sheetOrder: ['s1'],
  sheets: { s1: { id: 's1', name: 'Sheet1', cellData: {} } },
} as unknown as IWorkbookData

describe('evaluateEmbedFormula engine faults', () => {
  it('reports an engine error when Univer cannot be created', async () => {
    vi.mocked(createFormulaUniver).mockImplementation(() => {
      throw new Error('identifier already exists')
    })
    expect(await evaluateEmbedFormula(data, undefined, '=1')).toEqual({
      ok: false,
      reason: 'engine-error',
      detail: 'identifier already exists',
    })
  })

  it('keeps the result when disposing Univer throws', async () => {
    const univerAPI = {
      createWorkbook: () => ({ getId: () => 'wb1' }),
      getFormula: () => ({
        onCalculationResultApplied: async () => {},
        executeFormulas: async () => ({ wb1: { s1: { 0: { 0: [{ value: 7 }] } } } }),
      }),
    }
    const univer = {
      dispose: () => {
        throw new Error('dispose failed')
      },
    }
    vi.mocked(createFormulaUniver).mockReturnValue({ univer, univerAPI } as unknown as ReturnType<typeof createFormulaUniver>)
    expect(await evaluateEmbedFormula(data, undefined, '=7')).toEqual({ ok: true, kind: 'scalar', value: 7 })
  })
})
