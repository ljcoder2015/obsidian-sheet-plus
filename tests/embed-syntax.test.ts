import { describe, expect, it } from 'vitest'
import { parseEmbedLinkSyntax } from '../src/post-processor/embed-syntax'

describe('parseEmbedLinkSyntax', () => {
  it('parses a range with height and display type', () => {
    expect(parseEmbedLinkSyntax('Budget#Sheet1|A1:C7<100>{html}')).toMatchObject({
      fileName: 'Budget',
      sheetName: 'Sheet1',
      startCell: 'A1',
      endCell: 'C7',
      height: 100,
      displayType: 'html',
    })
  })

  it('parses a single cell', () => {
    const parsed = parseEmbedLinkSyntax('Budget#Sheet1|F21')
    expect(parsed).toMatchObject({ sheetName: 'Sheet1', startCell: 'F21' })
    expect(parsed.endCell).toBeUndefined()
  })

  it('parses a single cell with a display type', () => {
    expect(parseEmbedLinkSyntax('Budget#Sheet1|F21{html}')).toMatchObject({
      sheetName: 'Sheet1',
      startCell: 'F21',
      displayType: 'html',
    })
  })
})
