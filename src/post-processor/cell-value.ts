import type { ICellData, IStyleData, IWorkbookData, IWorksheetData, Nullable } from '@univerjs/core'
import { numfmt } from '@univerjs/core'

/** 0-based row and column for an A1-style reference such as `F21` or `AA3`. */
function parseCellRef(ref: string): { row: number, col: number } | undefined {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/)
  if (!match)
    return undefined
  let col = 0
  for (const ch of match[1])
    col = col * 26 + ch.charCodeAt(0) - 64
  return { row: Number.parseInt(match[2], 10) - 1, col: col - 1 }
}

function formatNumber(value: number, pattern: string | undefined): string {
  if (pattern) {
    try {
      return String(numfmt.format(pattern, value)).trim()
    }
    catch {
      // fall through to the unformatted number
    }
  }
  // the sheet shows 15 significant digits, so 2696.7999999999997 reads 2696.8
  return String(Number(value.toPrecision(15)))
}

/**
 * 按名称查找 sheet；未指定名称时取 sheetOrder 首个（或首个可用）sheet。
 */
function findSheet(data: IWorkbookData, sheetName: string | undefined): Partial<IWorksheetData> | undefined {
  const sheets = Object.values(data.sheets ?? {})
  return sheetName
    ? sheets.find(s => s.name === sheetName)
    : data.sheets?.[data.sheetOrder?.[0]] ?? sheets[0]
}

/**
 * The text a single cell shows in the sheet: its saved value (for a formula,
 * the last calculated result) in the cell's own number format.
 * Returns undefined when the sheet does not exist.
 */
export function cellText(data: IWorkbookData, sheetName: string | undefined, cellRef: string): string | undefined {
  const sheet = findSheet(data, sheetName)
  if (!sheet)
    return undefined

  const pos = parseCellRef(cellRef)
  if (!pos)
    return undefined
  const cell: ICellData | undefined | null = sheet.cellData?.[pos.row]?.[pos.col]
  if (!cell)
    return ''

  const style: Nullable<IStyleData> = typeof cell.s === 'string' ? data.styles?.[cell.s] : cell.s
  const value = cell.v

  if (value === undefined || value === null || value === '')
    return cell.p?.body?.dataStream?.replace(/\r?\n$/, '').trim() ?? ''
  if (cell.t === 3)
    return value === true || value === 1 || value === '1' || String(value).toUpperCase() === 'TRUE' ? 'TRUE' : 'FALSE'
  if (typeof value === 'number')
    return formatNumber(value, style?.n?.pattern)
  if (typeof value === 'boolean')
    return value ? 'TRUE' : 'FALSE'
  return String(value)
}

/**
 * 单元格是否「有公式但没有缓存结果」：
 * 快照里公式的结果未被缓存时，静态取值会落空，需要启动 Univer 实时计算才能显示。
 */
export function cellNeedsCalculation(data: IWorkbookData, sheetName: string | undefined, cellRef: string): boolean {
  const sheet = findSheet(data, sheetName)
  if (!sheet)
    return false

  const pos = parseCellRef(cellRef)
  if (!pos)
    return false
  const cell: ICellData | undefined | null = sheet.cellData?.[pos.row]?.[pos.col]
  // 无公式（含空单元格）时静态值即为最终值，无需计算
  if (!cell?.f)
    return false
  return cell.v === undefined || cell.v === null || cell.v === ''
}
