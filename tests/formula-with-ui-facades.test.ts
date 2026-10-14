// The full sheet view imports these UI facades. They patch FUniver for every instance in the
// bundle, including the formula-only one, so evaluation must still work with them loaded.
import '@univerjs/ui/facade'
import '@univerjs/sheets-ui/facade'
import '@univerjs/sheets-numfmt/facade'
import '@univerjs/sheets-filter/facade'
import '@univerjs/sheets-table/facade'
import '@univerjs/sheets-note/facade'
import '@univerjs/docs-ui/facade'
import '@univerjs/sheets-drawing/facade'
import '@univerjs/sheets-drawing-ui/facade'
import '@univerjs/sheets-data-validation/facade'
import '@univerjs/sheets-conditional-formatting/facade'
import '@univerjs/sheets-hyper-link-ui/facade'
import '@univerjs/sheets-thread-comment/facade'

import type { IWorkbookData } from '@univerjs/core'
import { describe, expect, it } from 'vitest'
import { evaluateEmbedFormula } from '../src/post-processor/formula'

const data = {
  id: 'wb1',
  sheetOrder: ['s1'],
  sheets: { s1: { id: 's1', name: 'Sheet 1', rowCount: 30, columnCount: 10, cellData: { 8: { 5: { v: 1 } }, 9: { 5: { f: '=F9*10' } } } } },
} as unknown as IWorkbookData

describe('evaluateEmbedFormula with the plugin UI facades loaded', () => {
  it('still evaluates', async () => {
    expect(await evaluateEmbedFormula(data, 'Sheet 1', '=SUM(F9:F10)')).toEqual({ ok: true, kind: 'scalar', value: 11 })
  })

  it('leaves nothing failing after the instance is disposed', async () => {
    await evaluateEmbedFormula(data, 'Sheet 1', '=1')
    await new Promise(resolve => setTimeout(resolve, 500))
  })
})
