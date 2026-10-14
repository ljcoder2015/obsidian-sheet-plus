import type { IWorkbookData, Nullable, Univer } from '@univerjs/core'
import type { FUniver } from '@univerjs/core/facade'
import { deepClone } from '../utils/data'
import { createFormulaUniver } from './formula-univer'

export type FormulaValue = number | string | boolean | null

export type FormulaFailure = 'sheet-not-found' | 'invalid-formula' | 'timeout' | 'engine-error'

export type FormulaResult =
  | { ok: true, kind: 'scalar', value: FormulaValue }
  | { ok: true, kind: 'array', rows: FormulaValue[][] }
  | { ok: false, reason: FormulaFailure, detail?: string }

/** The `value` shape `executeFormulas` returns (IFormulaExecuteResultItem['value']). */
export type RawFormulaValue = Nullable<FormulaValue | FormulaValue[][]>

export const FORMULA_TIMEOUT_MS = 5000

export function unwrapResult(value: RawFormulaValue): FormulaResult {
  if (value === null || value === undefined)
    return { ok: false, reason: 'invalid-formula' }

  if (!Array.isArray(value))
    return { ok: true, kind: 'scalar', value }

  const rows = value.filter(row => row.length > 0)
  if (rows.length === 0)
    return { ok: false, reason: 'invalid-formula' }

  if (rows.length === 1 && rows[0].length === 1)
    return { ok: true, kind: 'scalar', value: rows[0][0] ?? null }

  return { ok: true, kind: 'array', rows: rows.map(row => row.map(cell => cell ?? null)) }
}

/** The sheet named `sheetName`, or the first sheet when no name is given. */
export function resolveSheetId(data: IWorkbookData, sheetName?: string): string | undefined {
  const sheets = data.sheets ?? {}
  if (sheetName === undefined)
    return data.sheetOrder?.[0] ?? Object.keys(sheets)[0]

  return Object.entries(sheets).find(([, sheet]) => sheet.name === sheetName)?.[0]
}

export async function evaluateEmbedFormula(
  data: IWorkbookData,
  sheetName: string | undefined,
  formula: string,
  timeoutMs: number = FORMULA_TIMEOUT_MS,
): Promise<FormulaResult> {
  const sheetId = resolveSheetId(data, sheetName)
  if (!sheetId)
    return { ok: false, reason: 'sheet-not-found', detail: sheetName }

  let univer: Univer | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs)
  })

  const run = async (univerAPI: FUniver): Promise<FormulaResult> => {
    // createWorkbook mutates its input, so it gets a throwaway copy
    const workbook = univerAPI.createWorkbook(deepClone(data))
    const unitId = workbook.getId()
    const formulaApi = univerAPI.getFormula()
    // Univer's own timeout is longer than ours, so our timer always decides a timeout
    await formulaApi.onCalculationResultApplied(timeoutMs * 2)
    const result = await formulaApi.executeFormulas({ [unitId]: { [sheetId]: { 0: { 0: [formula] } } } })
    return unwrapResult(result[unitId]?.[sheetId]?.[0]?.[0]?.[0]?.value)
  }

  try {
    const created = createFormulaUniver()
    univer = created.univer
    const running = run(created.univerAPI)
    // after a timeout the instance is disposed under the still-running promise; keep its
    // rejection from surfacing as unhandled
    running.catch(() => {})

    const outcome = await Promise.race([running, timedOut])
    return outcome === 'timeout' ? { ok: false, reason: 'timeout' } : outcome
  }
  catch (error) {
    return { ok: false, reason: 'engine-error', detail: error instanceof Error ? error.message : String(error) }
  }
  finally {
    clearTimeout(timer)
    try {
      univer?.dispose()
    }
    catch {
      // the result is already decided; a failed cleanup must not replace it
    }
  }
}
