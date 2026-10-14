import { numfmt } from '@univerjs/core'
import type { FormulaFailure, FormulaResult, FormulaValue } from './formula'

export const MAX_TABLE_ROWS = 200

export type FormulaView =
  | { kind: 'value', text: string }
  | { kind: 'table', rows: string[][], omittedRows: number }
  | { kind: 'error', reason: FormulaFailure, detail?: string }

const ERROR_KEYS: Record<FormulaFailure, string> = {
  'sheet-not-found': 'FORMULA_ERROR_SHEET_NOT_FOUND',
  'invalid-formula': 'FORMULA_ERROR_INVALID',
  'timeout': 'FORMULA_ERROR_TIMEOUT',
  'engine-error': 'FORMULA_ERROR_ENGINE',
}

/** A cell value as text; `pattern` is a number format and applies to numbers only. */
export function formatValue(value: FormulaValue, pattern?: string): string {
  if (value === null)
    return ''
  if (typeof value === 'boolean')
    return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number' && pattern) {
    try {
      return numfmt.format(pattern, value)
    }
    catch {
      // an invalid pattern falls through to the unformatted number
    }
  }
  // 15 significant digits, as the sheet shows them: 0.1 + 0.2 is 0.3, not 0.30000000000000004
  if (typeof value === 'number')
    return String(Number(value.toPrecision(15)))
  return String(value)
}

export function toFormulaView(result: FormulaResult, pattern?: string, maxRows: number = MAX_TABLE_ROWS): FormulaView {
  if (!result.ok)
    return { kind: 'error', reason: result.reason, detail: result.detail }

  if (result.kind === 'scalar')
    return { kind: 'value', text: formatValue(result.value, pattern) }

  const shown = result.rows.slice(0, maxRows)
  return {
    kind: 'table',
    rows: shown.map(row => row.map(value => formatValue(value, pattern))),
    omittedRows: result.rows.length - shown.length,
  }
}

const latestRun = new WeakMap<object, number>()
let runCounter = 0

/**
 * Marks a new evaluation for `target` and returns a check that stays true only while no
 * newer evaluation has started, so a slow, stale result never overwrites a fresh one.
 */
export function startRun(target: object): () => boolean {
  const run = ++runCounter
  latestRun.set(target, run)
  return () => latestRun.get(target) === run
}

export function renderFormulaView(el: HTMLElement, view: FormulaView, t: (key: string) => string): void {
  el.classList.remove('lj-formula-value', 'lj-formula-table', 'lj-formula-error')
  el.removeAttribute('title')
  el.replaceChildren()

  if (view.kind === 'value') {
    el.classList.add('lj-formula-value')
    el.textContent = view.text
    return
  }

  if (view.kind === 'error') {
    const message = t(ERROR_KEYS[view.reason])
    el.classList.add('lj-formula-error')
    el.textContent = '#ERROR'
    el.title = view.detail ? `${message}: ${view.detail}` : message
    return
  }

  const doc = el.ownerDocument
  const table = doc.createElement('table')
  const body = doc.createElement('tbody')
  for (const row of view.rows) {
    const tr = doc.createElement('tr')
    for (const text of row) {
      const td = doc.createElement('td')
      td.textContent = text
      tr.appendChild(td)
    }
    body.appendChild(tr)
  }
  if (view.omittedRows > 0) {
    const tr = doc.createElement('tr')
    const td = doc.createElement('td')
    td.colSpan = Math.max(1, view.rows[0]?.length ?? 1)
    td.textContent = t('FORMULA_ROWS_OMITTED').replace('{count}', String(view.omittedRows))
    tr.appendChild(td)
    body.appendChild(tr)
  }
  table.appendChild(body)
  el.classList.add('lj-formula-table')
  el.appendChild(table)
}
