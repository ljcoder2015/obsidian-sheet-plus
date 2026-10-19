import type { IWorkbookData } from '@univerjs/core'
import { describe, expect, it } from 'vitest'
import { getRangeData } from '../src/utils/data'

/** 构造含浮动图的表格数据（每次返回全新对象，避免 getRangeData 的原地修改互相污染） */
function makeWorkbook(): IWorkbookData {
  return {
    id: 'wb',
    name: 'demo',
    sheetOrder: ['s1'],
    sheets: {
      s1: {
        id: 's1',
        name: 'bar',
        rowCount: 100,
        columnCount: 26,
        defaultRowHeight: 19,
        defaultColumnWidth: 19,
        cellData: {},
      },
    },
    resources: [
      {
        name: 'SHEET_DRAWING_PLUGIN',
        data: JSON.stringify({
          // 当前 sheet：图落在 row 15~31，超出 D8:D8 保留范围
          s1: {
            data: { d1: { sheetTransform: { from: { row: 15, column: 1 }, to: { row: 31, column: 8 } } } },
            order: ['d1'],
          },
          // 其它 sheet：其表格已被裁剪掉
          s2: {
            data: { d2: { sheetTransform: { from: { row: 1, column: 1 }, to: { row: 2, column: 2 } } } },
            order: ['d2'],
          },
        }),
      },
      { name: 'SHEET_NOTE_PLUGIN', data: JSON.stringify({ s1: { 0: { 0: { v: 'note' } } } }) },
    ],
  } as unknown as IWorkbookData
}

function resourceData(data: IWorkbookData, name: string): unknown {
  const resource = data.resources?.find(item => item.name === name)
  if (!resource) {
    throw new Error(`missing resource: ${name}`)
  }
  return JSON.parse(resource.data)
}

describe('getRangeData 裁剪浮动图', () => {
  it('丢弃落在保留区域外的浮动图', () => {
    const data = getRangeData(makeWorkbook(), 'bar', 'D8:D8')
    expect(resourceData(data as IWorkbookData, 'SHEET_DRAWING_PLUGIN')).toEqual({
      s1: { data: {}, order: [] },
    })
  })

  it('保留与保留区域有交集的浮动图', () => {
    const data = getRangeData(makeWorkbook(), 'bar', 'A1:Z100')
    const parsed = resourceData(data as IWorkbookData, 'SHEET_DRAWING_PLUGIN') as {
      s1: { data: Record<string, unknown>, order: string[] }
    }
    expect(Object.keys(parsed.s1.data)).toEqual(['d1'])
    expect(parsed.s1.order).toEqual(['d1'])
  })

  it('不修改非浮动图资源', () => {
    const data = getRangeData(makeWorkbook(), 'bar', 'D8:D8')
    expect(resourceData(data as IWorkbookData, 'SHEET_NOTE_PLUGIN')).toEqual({
      s1: { 0: { 0: { v: 'note' } } },
    })
  })
})
