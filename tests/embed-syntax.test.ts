import { describe, expect, it } from 'vitest'
import { parseEmbedLink } from '../src/post-processor/embed-syntax'

describe('parseEmbedLink: range embeds', () => {
  it('parses a sheet and a range', () => {
    expect(parseEmbedLink('Budget#Sheet 2', 'F9:F20')).toEqual({
      kind: 'range',
      fileName: 'Budget',
      sheetName: 'Sheet 2',
      startCell: 'F9',
      endCell: 'F20',
    })
  })

  it('accepts multi-letter columns', () => {
    expect(parseEmbedLink('Budget#Sheet1', 'AA1:AB5')).toMatchObject({ startCell: 'AA1', endCell: 'AB5' })
  })

  it('accepts lowercase cells and normalises them', () => {
    expect(parseEmbedLink('Budget#Sheet1', 'a1:d4')).toMatchObject({ startCell: 'A1', endCell: 'D4' })
  })

  it('reads height and display type', () => {
    expect(parseEmbedLink('Budget#Sheet1', 'A1:D4<300>{html}')).toMatchObject({
      startCell: 'A1',
      endCell: 'D4',
      height: 300,
      displayType: 'html',
    })
    expect(parseEmbedLink('Budget#Sheet1', 'B5:D10<300>{chart-bar}')).toMatchObject({ height: 300, displayType: 'chart-bar' })
  })

  it('treats an empty alt as a whole-sheet embed', () => {
    expect(parseEmbedLink('Budget#Sheet1', '')).toEqual({ kind: 'range', fileName: 'Budget', sheetName: 'Sheet1' })
  })

  it('treats Obsidian display text in alt as a whole-sheet embed', () => {
    expect(parseEmbedLink('data#Sheet 2', 'data > Sheet 2')).toEqual({ kind: 'range', fileName: 'data', sheetName: 'Sheet 2' })
  })

  it('keeps folders and emoji in the file name', () => {
    expect(parseEmbedLink('🏡 Remaining Rent/data#Sheet 2', 'F9:F20')).toMatchObject({
      fileName: '🏡 Remaining Rent/data',
      sheetName: 'Sheet 2',
    })
  })

  it('has no sheet name without a #', () => {
    expect(parseEmbedLink('Folder/Budget.univer', 'A1:B2')).toEqual({
      kind: 'range',
      fileName: 'Folder/Budget.univer',
      startCell: 'A1',
      endCell: 'B2',
    })
  })

  it('splits the sheet name at the first # only', () => {
    expect(parseEmbedLink('Budget#Q1#2', 'A1:B2')).toMatchObject({ fileName: 'Budget', sheetName: 'Q1#2' })
  })
})

describe('parseEmbedLink: formula embeds', () => {
  it('recognises a leading =', () => {
    expect(parseEmbedLink('🏡 Remaining Rent/data#Sheet 2', '=SUM(F9:F20)')).toEqual({
      kind: 'formula',
      fileName: '🏡 Remaining Rent/data',
      sheetName: 'Sheet 2',
      formula: '=SUM(F9:F20)',
    })
  })

  it('ignores leading whitespace', () => {
    expect(parseEmbedLink('Budget', ' =SUM(A1:A2)')).toMatchObject({ kind: 'formula', formula: '=SUM(A1:A2)' })
  })

  it('keeps / : < > inside the formula', () => {
    expect(parseEmbedLink('Folder/Budget#Sheet1', '=F9/F10')).toMatchObject({ fileName: 'Folder/Budget', formula: '=F9/F10' })
    expect(parseEmbedLink('Budget', '=IF(A1<300,1,0)')).toMatchObject({ formula: '=IF(A1<300,1,0)' })
    expect(parseEmbedLink('Budget', '=A1>300')).toMatchObject({ formula: '=A1>300' })
  })

  it('keeps array literals as part of the formula', () => {
    expect(parseEmbedLink('Budget', '={1,2;3,4}')).toEqual({ kind: 'formula', fileName: 'Budget', formula: '={1,2;3,4}' })
    expect(parseEmbedLink('Budget', '={4}')).toEqual({ kind: 'formula', fileName: 'Budget', formula: '={4}' })
  })

  it('splits off a trailing {fmt:…}', () => {
    expect(parseEmbedLink('Budget#Sheet 2', '=SUM(F9:F20){fmt:$#,##0.00}')).toEqual({
      kind: 'formula',
      fileName: 'Budget',
      sheetName: 'Sheet 2',
      formula: '=SUM(F9:F20)',
      format: '$#,##0.00',
    })
    expect(parseEmbedLink('Budget', '={1,2}{fmt:0%}')).toMatchObject({ formula: '={1,2}', format: '0%' })
  })

  it('ignores an empty {fmt:}', () => {
    expect(parseEmbedLink('Budget', '=A1{fmt:}')).toEqual({ kind: 'formula', fileName: 'Budget', formula: '=A1' })
  })
})
