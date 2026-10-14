import { describe, expect, it } from 'vitest'
import { unwrapResult } from '../src/post-processor/formula'
import { formatValue, startRun, toFormulaView } from '../src/post-processor/formula-render'

describe('unwrapResult', () => {
  it('passes scalars through', () => {
    expect(unwrapResult(23)).toEqual({ ok: true, kind: 'scalar', value: 23 })
    expect(unwrapResult('#DIV/0!')).toEqual({ ok: true, kind: 'scalar', value: '#DIV/0!' })
    expect(unwrapResult(true)).toEqual({ ok: true, kind: 'scalar', value: true })
    expect(unwrapResult(0)).toEqual({ ok: true, kind: 'scalar', value: 0 })
  })

  it('collapses a 1x1 array to a scalar', () => {
    expect(unwrapResult([[4]])).toEqual({ ok: true, kind: 'scalar', value: 4 })
  })

  it('keeps larger arrays as rows', () => {
    expect(unwrapResult([[1, 2], [3, 4]])).toEqual({ ok: true, kind: 'array', rows: [[1, 2], [3, 4]] })
    expect(unwrapResult([[1], [2]])).toEqual({ ok: true, kind: 'array', rows: [[1], [2]] })
    expect(unwrapResult([[1, null]])).toEqual({ ok: true, kind: 'array', rows: [[1, null]] })
  })

  it('treats null, undefined and empty arrays as an invalid formula', () => {
    expect(unwrapResult(null)).toEqual({ ok: false, reason: 'invalid-formula' })
    expect(unwrapResult(undefined)).toEqual({ ok: false, reason: 'invalid-formula' })
    expect(unwrapResult([])).toEqual({ ok: false, reason: 'invalid-formula' })
  })
})

describe('formatValue', () => {
  it('formats numbers with a pattern', () => {
    expect(formatValue(1234.5, '$#,##0.00')).toBe('$1,234.50')
    expect(formatValue(0.25, '0%')).toBe('25%')
  })

  it('shows numbers as-is without a pattern', () => {
    expect(formatValue(1234.5)).toBe('1234.5')
  })

  it('hides floating-point noise the way the sheet does', () => {
    expect(formatValue(0.1 + 0.2)).toBe('0.3')
    expect(formatValue(24.299999999999997)).toBe('24.3')
    expect(formatValue(123456789012)).toBe('123456789012')
  })

  it('ignores the pattern for text and errors', () => {
    expect(formatValue('hi', '0%')).toBe('hi')
    expect(formatValue('#DIV/0!', '0%')).toBe('#DIV/0!')
  })

  it('shows booleans the way the sheet does', () => {
    expect(formatValue(true)).toBe('TRUE')
    expect(formatValue(false)).toBe('FALSE')
  })

  it('shows null as empty', () => {
    expect(formatValue(null)).toBe('')
  })
})

describe('toFormulaView', () => {
  it('turns a scalar into text', () => {
    expect(toFormulaView({ ok: true, kind: 'scalar', value: 0.5 }, '0%')).toEqual({ kind: 'value', text: '50%' })
  })

  it('formats every cell of an array', () => {
    expect(toFormulaView({ ok: true, kind: 'array', rows: [[1, null], [true, 'x']] }, '0.0')).toEqual({
      kind: 'table',
      rows: [['1.0', ''], ['TRUE', 'x']],
      omittedRows: 0,
    })
  })

  it('caps long arrays and counts what was left out', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => [i])
    const view = toFormulaView({ ok: true, kind: 'array', rows })
    expect(view).toMatchObject({ kind: 'table', omittedRows: 800 })
    expect(view.kind === 'table' && view.rows.length).toBe(200)
  })

  it('passes failures through', () => {
    expect(toFormulaView({ ok: false, reason: 'sheet-not-found', detail: 'Nope' })).toEqual({
      kind: 'error',
      reason: 'sheet-not-found',
      detail: 'Nope',
    })
  })
})

describe('startRun', () => {
  it('only the latest run for a target is current', () => {
    const el = {}
    const first = startRun(el)
    expect(first()).toBe(true)
    const second = startRun(el)
    expect(first()).toBe(false)
    expect(second()).toBe(true)
  })

  it('tracks targets independently', () => {
    const a = startRun({})
    startRun({})
    expect(a()).toBe(true)
  })
})
