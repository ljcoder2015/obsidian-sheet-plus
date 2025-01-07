import type { IWorkbookData } from '@univerjs/core'
import type { FRange } from '@univerjs/sheets/lib/types/facade/index'
import type { TFile } from 'obsidian'

/**
 * Markdown 拆分yaml部分跟正文部分
 * @param str Markdown 文本
 * @returns { yaml: string, rest: string }
 */
export function splitYAML(str: string): { yaml: string, rest: string } | null {
  const match = str.match(/^-{3}\n([\s\S]*?)-{3}\n([\s\S]*)/)
  if (match) {
    const yamlPart = match[1].trim()
    const restPart = match[2].trim()
    return { yaml: yamlPart, rest: restPart }
  }
  else {
    return null
  }
}

/**
 * Markdown 获取 yaml 部分
 * @param str
 * @returns
 */
export function extractYAML(str: string): string | null {
  const match = str.match(/^-{3}\n([\s\S]*?)-{3}/)
  return match ? match[1].trim() : null
}

/**
 * Markdown 获取正文部分并解析成 IWorkbookData
 * @param str Markdown 文本
 * @returns
 */
export function getExcelData(str: string, file: TFile): IWorkbookData | null {
  const markdown = splitYAML(str)?.rest
  if (markdown) {
    const json = markdown.replaceAll('```', '')
    if (json) {
      // console.log("getExcelData-----", json)
      const data: IWorkbookData = JSON.parse(json)
      if (data) {
        data.name = file.path
        return data
      }
    }
  }
  return null
}

/**
 * data 转换成只显示 range 部分
 * @param {JSON} data 源数据
 * @param {string} range 格式为 A1:B6
 */
export function getRangeData(
  data: IWorkbookData | null,
  sheet: string,
  range: string,
): IWorkbookData | null {
  if (data == null)
    return data

  const currentSheet = Object.values(data.sheets).find((item) => {
    return item.name === sheet
  })
  if (!currentSheet)
    return data

  const rangeNumber = rangeToNumber(range)

  currentSheet.rowCount = rangeNumber.endRow + 1
  currentSheet.columnCount = rangeNumber.endCol + 1

  const rowData = currentSheet.rowData || {}
  for (let i = 0; i < rangeNumber.startRow; i++) {
    const key = i
    if (rowData[key]) {
      rowData[key].hd = 1
    }
    else {
      rowData[key] = {
        hd: 1,
        h: currentSheet.defaultRowHeight || 19,
      }
    }
  }

  const colData = currentSheet.columnData || {}
  for (let i = 0; i < rangeNumber.startCol; i++) {
    const key = i
    if (colData[key]) {
      colData[key].hd = 1
    }
    else {
      colData[key] = {
        hd: 1,
        w: currentSheet.defaultColumnWidth || 19,
      }
    }
  }

  const sheets: { [key: string]: any } = {}
  const sheetId = currentSheet.id || ''
  sheets[sheetId] = currentSheet
  data.sheets = sheets

  data.sheetOrder = [sheetId]

  return data
}

export interface RangeIndex {
  startCol: number
  startRow: number
  endCol: number
  endRow: number
}

/**
 * range 字符串转换成 RangeIndex
 * @param range 例如A1:C3
 * @returns RangeIndex
 */
export function rangeToNumber(range: string): RangeIndex {
  const [start, end] = range.split(':')
  const startResult = splitAlphaNumeric(start) || { col: 0, row: 0 }
  const startCol = startResult.col
  const startRow = startResult.row

  const endResult = splitAlphaNumeric(end) || { col: 0, row: 0 }
  const endCol = endResult.col
  const endRow = endResult.row

  return {
    startCol,
    startRow,
    endCol,
    endRow,
  }
}

/**
 * 行列索引转行列数字对象
 * @param input 行列索引，例如 A1 A为列索引，1为行索引
 * @returns A1 => { col: 0, row: 0}
 */
function splitAlphaNumeric(input: string): { col: number, row: number } | null {
  const match = input.match(/([A-Z]+)(\d+)/i)
  if (match) {
    const alphaPart = match[1]
    const colIndex = stringToNumber(alphaPart)
    const numericPart = Number.parseInt(match[2]) - 1
    return { col: colIndex, row: numericPart }
  }
  else {
    return null
  }
}

/**
 *
 * @param str 字母转数字 A = 0 为基准
 * @returns
 */
export function stringToNumber(str: string): number {
  const map: { [key: string]: number } = {}
  const base = 'A'.charCodeAt(0)
  for (let i = 0; i < 26; i++)
    map[String.fromCharCode(i + base)] = i

  let num = 0
  for (let i = 0; i < str.length; i++)
    num = num * 26 + map[str[i]]

  return num
}

/**
 * FRange 转 字符串
 * @param row 开始行索引
 * @param column 开始列索引
 * @param width 有几列
 * @param height 有几行
 * @returns {row: 1, column: 2, width: 3, height: 3} => C2:E4
 */
export function rangeToRangeString(range: FRange): string {
  const sri = range.getRow()
  const eri = sri + range.getHeight() - 1

  const sci = range.getColumn()
  const eci = sci + range.getWidth() - 1
  // 格式 ${sci}${sri}:${eci}${eri}
  return `${numberToColRowString(sci, sri)}:${numberToColRowString(
    eci,
    eri,
  )}`
}

/**
 * 行列数字索引 转 字母数字字符串
 * @param colNumber
 * @param rowNumber
 * @returns { colNumber: 0, rowNumber: 0} => A1
 */
export function numberToColRowString(
  colNumber: number,
  rowNumber: number,
): string {
  const base = 'A'.charCodeAt(0) - 1
  let col = colNumber + 1
  const row = rowNumber + 1

  let result = ''
  while (col > 0) {
    const remainder = col % 26
    result = String.fromCharCode(remainder + base) + result
    col = Math.floor(col / 26)
  }

  return result + row
}
