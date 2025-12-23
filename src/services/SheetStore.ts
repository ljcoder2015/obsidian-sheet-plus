import type { TFile } from 'obsidian'
import { type IWorkbookData, LocaleType } from '@univerjs/core'
import { log } from '@ljcoder/smart-sheet/src/utils/log'
import { deepClone } from '../utils/data'
import type { MultiSheet, ParsedHeader, ParsedMarkdown, StoreEvent, StoreEventSource } from './type'
import { OUTGOING_LINKS_KEY, TABS_KEY } from './type'
import { stringifyMarkdown } from './utils'

export class SheetStore {
  readonly file: TFile

  // ===== 单一真相 =====
  header?: ParsedHeader
  blocks = new Map<string, unknown>()
  workbook!: IWorkbookData

  // ===== 事件 =====
  private listeners = new Set<(e: StoreEvent) => void>()

  constructor(
    file: TFile,
    parsed: ParsedMarkdown,
  ) {
    this.file = file
    this.header = parsed.header
    this.blocks = parsed.blocks ?? new Map()
    this.workbook = this.initWorkbook()
    this.updateFilePath(this.file.path)
  }

  private initWorkbook(): IWorkbookData {
    const sheet = this.blocks.get('sheet')
    if (sheet && typeof sheet !== 'string')
      return sheet as IWorkbookData

    return {
      name: this.file.path,
      id: `${Date.now()}`,
      appVersion: '',
      locale: LocaleType.ZH_CN,
      styles: {},
      sheetOrder: [],
      sheets: {},
    }
  }

  /* ---------------- 订阅 ---------------- */

  subscribe(fn: (e: StoreEvent) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(e: StoreEvent) {
    this.listeners.forEach(fn => fn(e))
  }

  /* ---------------- 读 API ---------------- */

  getWorkbook() {
    return this.workbook
  }

  getHeaderProperties(): Record<string, string> {
    return this.header?.properties ?? {}
  }

  getHeaderProperty(key: string): string | undefined {
    return this.header?.properties[key] ?? undefined
  }

  getHeader(): string {
    return this.header?.raw || ''
  }

  getTabs(): MultiSheet | undefined {
    return this.blocks.get(TABS_KEY) as MultiSheet | undefined
  }

  getOutgoingLinks(): string[] {
    return this.blocks.get(OUTGOING_LINKS_KEY) as string[] || []
  }

  /* ---------------- 唯一写入口 ---------------- */
  private setBlock(key: string, data: any) {
    this.blocks?.set(key, data)
  }

  private removeBlock(key: string) {
    this.blocks?.delete(key)
  }

  private updateFilePath(path: string) {
    if (this.workbook.name !== path) {
      this.workbook.name = path
      this.emit({ type: 'hydrate', source: 'system' })
    }
  }

  removeTab(key: string) {
    const tabs = this.getTabs()
    if (!tabs) {
      return
    }
    let activeKey = tabs.defaultActiveKey
    if (tabs.defaultActiveKey === key) {
      activeKey = 'sheet'
    }
    const newTabs: MultiSheet = {
      ...tabs,
      tabs: tabs.tabs?.filter(tab => tab.key !== key),
      defaultActiveKey: activeKey,
    }
    this.setBlock(TABS_KEY, newTabs)
    this.removeBlock(key)
    this.emit({ type: 'tabs:update', tabs: newTabs, source: 'tabs' })
  }

  updateWorkbook(
    workbook: IWorkbookData,
    source: StoreEventSource,
  ) {
    this.workbook = workbook
    this.emit({ type: 'workbook:update', workbook, source })
  }

  addOutgoingLink(link: string) {
    const links = this.getOutgoingLinks()
    links.push(link)
    this.setBlock(OUTGOING_LINKS_KEY, links)
    this.emit({ type: 'link:add', link, source: 'system' })
  }

  // 更新 outgoing links 中的 [[xxx]] 链接, 保证被 Obsidian 解析
  // 只在更改文件名称处理外链使用，无需发送更改通知
  updateObsidianLink(
    oldLink: string,
    newLink: string,
  ) {
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
    this.setBlock(OUTGOING_LINKS_KEY, newLinks)
  }

  /**
   * 遍历 workbook 所有 sheet，更新所有 rangeType == 100 的链接
   * 只在更改文件名称处理外链使用，无需发送更改通知
   * @param newLink 新的链接
   * @param oldLink 要替换的旧链接
   */
  updateSheetOutgoingLinks(
    newLink: string,
    oldLink: string,
  ) {
    const workbook = this.workbook
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

  /* ---------------- 序列化 ---------------- */

  toMarkdown(): string {
    this.blocks.set('sheet', this.workbook)
    return stringifyMarkdown({
      header: this.header,
      blocks: this.blocks,
      compact: true,
    }) || ''
  }
}
