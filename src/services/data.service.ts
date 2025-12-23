import type { TFile } from 'obsidian'
import type { IWorkbookData } from '@univerjs/core'
import { log } from '@ljcoder/smart-sheet/src/utils/log'
import { deepClone } from '../utils/data'
import type { ParsedHeader, ParsedMarkdown } from './type'
import { parseMarkdown } from './utils'

export const outgoingLinksKey = 'outgoingLinks'

export class DataService {
  markdownData: ParsedMarkdown
  file: TFile

  constructor(file: TFile, fileData: string) {
    this.file = file
    this.markdownData = parseMarkdown(fileData)
    this.updateFilePath(file.path)
  }

  getFilePath(): string {
    const sheet = this.getSheet()
    return sheet?.name || ''
  }

  updateFilePath(path: string) {
    const sheet = this.getSheet()
    if (sheet) {
      if (sheet.name !== path) {
        sheet.name = path
      }
    }
    else {
      log('[dataService]', 'updateFilePath', 'sheet not found')
    }
  }

  getHeaderProperties(): Record<string, string> {
    return this.markdownData.header?.properties ?? {}
  }

  getHeaderProperty(key: string): string | undefined {
    return this.markdownData.header?.properties[key] ?? undefined
  }

  getHeader(): string {
    return this.markdownData.header?.raw || ''
  }

  getBlocks(): Map<string, any> {
    return this.markdownData.blocks ?? new Map()
  }

  getBlock<T>(type: string): T | undefined {
    return this.markdownData.blocks?.get(type) as T ?? undefined
  }

  getSheet(): IWorkbookData | undefined {
    const sheet = this.getBlock<IWorkbookData>('sheet')
    log('[dataService]', 'getSheet', sheet)
    if (typeof sheet === 'string') {
      return { name: this.file.path }
    }
    return sheet ?? { name: this.file.path }
  }

  getOutgoingLinks(): string[] {
    return this.getBlock<string[]>(outgoingLinksKey) ?? []
  }

  setOutgoingLinks(links: string[]) {
    this.setBlock(outgoingLinksKey, links)
  }

  // 更新markdown文本 [[xxx]] 这样才能被 Obsidian 解析
  updateOutgoingLink(newLink: string, oldLink: string) {
    const links = this.getOutgoingLinks()
    const newLinks = links.map((link) => {
      log('[dataService]', 'updateOutgoingLink', link, oldLink)
      if (link === `[[${oldLink}]]`) {
        return `[[${newLink}]]`
      }
      else {
        return link
      }
    })
    log('[dataService]', 'updateOutgoingLink', newLinks, links)
    this.setOutgoingLinks(newLinks)
  }

  /**
   * 获取 workbook 中所有 outgoing links
   * @returns 链接数组（去重）
   */
  getSheetOutgoingLinks(): string[] {
    const workbook = this.getSheet()
    if (!workbook) {
      return []
    }

    const links: Set<string> = new Set()

    if (!workbook.sheets) {
      return []
    }

    for (const sheetId of Object.keys(workbook.sheets)) {
      const sheet = workbook.sheets[sheetId]
      if (!sheet?.cellData)
        continue

      for (const rowKey of Object.keys(sheet.cellData)) {
        const row = sheet.cellData[rowKey]
        if (!row) {
          continue
        }

        for (const colKey of Object.keys(row)) {
          const cell = row[colKey]
          if (!cell?.p?.body?.customRanges) {
            continue
          }

          cell.p.body.customRanges.forEach((range: any) => {
            if (range.rangeType === 100 && range.properties?.url) {
              links.add(range.properties.url)
            }
          })
        }
      }
    }

    return Array.from(links)
  }

  /**
   * 遍历 workbook 所有 sheet，更新所有 rangeType == 100 的链接
   * @param workbook Univer workbook data
   * @param newLink 新的链接
   * @param oldLink 要替换的旧链接
   * @returns 更新后的 workbook（原地修改）
   */
  updateSheetOutgoingLinks(
    newLink: string,
    oldLink: string,
  ): IWorkbookData {
    const workbook = this.getSheet()
    if (!workbook) {
      return workbook
    }

    if (!workbook.sheets) {
      return workbook
    }

    for (const sheetId of Object.keys(workbook.sheets)) {
      const sheet = workbook.sheets[sheetId]
      if (!sheet?.cellData) {
        continue
      }

      for (const rowKey of Object.keys(sheet.cellData)) {
        const row = sheet.cellData[rowKey]
        if (!row) {
          continue
        }

        for (const colKey of Object.keys(row)) {
          const cell = row[colKey]
          if (!cell?.p?.body?.customRanges) {
            continue
          }

          cell.p.body.customRanges.forEach((range: any) => {
            if (range.rangeType === 100 && range.properties?.url === `[[${oldLink}]]`) {
              range.properties.url = `[[${newLink}]]`
              cell.p.body.dataStream = cell.p.body.dataStream?.replace(oldLink, newLink)
              cell.p.body.textRuns?.forEach((textRun: any) => {
                textRun.ed = newLink.length
              })
            }
          })
        }
      }
    }
  }

  setBlock(key: string, data: any) {
    this.markdownData.blocks?.set(key, deepClone(data))
  }

  deleteBlock(key: string) {
    this.markdownData.blocks?.delete(key)
  }
}
