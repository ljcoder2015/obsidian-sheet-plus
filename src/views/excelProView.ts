import type { WorkspaceLeaf } from 'obsidian'
import { Notice, TextFileView } from 'obsidian'
import type { IWorkbookData, Univer, Workbook } from '@univerjs/core'
import { FUniver, UniverInstanceType } from '@univerjs/core'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import type ExcelProPlugin from '../main'
import { renderToHtml } from '../post-processor/html'

import {
  extractYAML,
  getExcelData,
  rangeToNumber,
  rangeToRangeString,
} from '../utils/data'
import { randomString } from '../utils/uuid'
import { FRONTMATTER, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { createUniver } from './univer/setup-univer'

export class ExcelProView extends TextFileView {
  public plugin: ExcelProPlugin
  public importEle: HTMLElement
  public exportEle: HTMLElement
  public embedLinkEle: HTMLElement
  public copyHTMLEle: HTMLElement
  public sheetEle: HTMLElement
  public univerAPI: FUniver // 表格操作对象
  public univer: Univer | null // 表格对象
  public workbook: Workbook // 工作簿

  private univerId: string
  private lastWorkbookData: string // 上次保存的数据
  // private dataWorker: Worker; // 用来异步解析数据

  private subPath: string | null

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  onload(): void {
    super.onload()

    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ =>
      this.copyToHTML())

    // 添加事件监听器
    document.addEventListener('keydown', this.handleEscapeKey)
  }

  onunload(): void {
    // console.log(`Excel Pro View onunload`);
    // 释放 univer 相关对象
    this.dispose()

    super.onunload()
  }

  dispose() {
    // 释放工作簿
    if (this.workbook !== null && this.workbook !== undefined)
      this.workbook.dispose()

    // 释放 univer
    if (this.univer !== null && this.univer !== undefined) {
      this.univer.dispose()
      this.univer = null
    }

    this.subPath = null

    // 调用移除事件监听器的函数
    this.removeListener()
  }

  // 定义事件处理函数
  handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // console.log('ESC 键被按下')
      // 在这里可以执行需要的操作
    }
  }

  // 在某个时刻移除事件监听器
  // 比如当你关闭某个模态框时
  removeListener() {
    document.removeEventListener('keydown', this.handleEscapeKey)
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  setupUniver() {
    this.dispose()
    this.contentEl.empty()
    this.sheetEle = this.contentEl.createDiv({
      attr: {
        id: 'sheet-box',
      },
    })

    const id = `univer-${randomString(6)}`
    this.sheetEle.createDiv({
      attr: {
        id,
        class: 'my-univer',
      },
    })

    // 设置多语言
    const options = {
      header: true,
      footer: true,
    }
    this.univer = createUniver(options, id)
    this.univerAPI = FUniver.newAPI(this.univer)

    const data = getExcelData(this.data, this.file)
    if (data) {
      // workbookData 的内容都包含在 workbook 字段中
      const workbookData: IWorkbookData = data
      this.workbook = this.univer.createUnit(
        UniverInstanceType.UNIVER_SHEET,
        workbookData,
      )
    }
    else {
      this.workbook = this.univer.createUnit(
        UniverInstanceType.UNIVER_SHEET,
        {
          name: this.file.path,
        },
      )
    }

    this.univerAPI.onCommandExecuted((command) => {
      const blackList = [
        'sheet.operation.set-scroll',
        'sheet.command.set-scroll-relative',
        'sheet.operation.set-selections',
        'doc.operation.set-selections',
        'sheet.operation.set-activate-cell-edit',
        'sheet.operation.set-selections',
        'sheet.command.scroll-view',
        'formula-ui.operation.search-function',
        'formula-ui.operation.help-function',
        'formula.mutation.set-formula-calculation-start',
      ]

      if (blackList.contains(command.id))
        return

      const activeWorkbook = this.univerAPI.getActiveWorkbook()
      if (!activeWorkbook)
        throw new Error('activeWorkbook is not defined')

      const activeWorkbookData = JSON.stringify(activeWorkbook.getSnapshot())

      if (this.lastWorkbookData === null) {
        // 第一次加载不处理
        this.lastWorkbookData = activeWorkbookData
        return
      }

      if (this.lastWorkbookData === activeWorkbookData) {
        // 没变化不处理
        return
      }

      // console.log("\n===onCommandExecuted===\n", activeWorkbookData, "\n===command===", command)

      this.lastWorkbookData = activeWorkbookData

      this.saveDataToFile(activeWorkbookData)
    })
  }

  getViewData(): string {
    return this.data
  }

  headerData() {
    let header = extractYAML(this.data)

    if (header == null) {
      header = FRONTMATTER
    }
    else {
      // 添加 --- 分隔符
      header = ['---', '', `${header}`, '', '---', '', '', '```', ''].join('\n')
    }

    return header
  }

  saveDataToFile(data: string) {
    const yaml = this.headerData()

    this.data = `${yaml + data}\n\`\`\``

    this.save(false)
      .then(() => {
        // console.log("save data success", this.file);
      })
      .catch((e) => {
        // console.log("save data error", e);
      })
  }

  clear(): void {
    this.data = this.headerData()
  }

  setEphemeralState(state: any): void {
    if (state.subpath) {
      const path = state.subpath as string
      this.subPath = path

      this.scrollToRange()
    }
  }

  scrollToRange() {
    if (this.subPath) {
      setTimeout(() => {
        const array = this.subPath.split('|')
        const sheetName = array[0]
        const rangeString = array[1]
        const rangeNumber = rangeToNumber(rangeString)
        // 打开文件后的子路径，用来选中表格范围
        const activeWorkbook = this.univerAPI.getActiveWorkbook()
        const sheet = activeWorkbook.getSheetByName(sheetName)
        activeWorkbook.setActiveSheet(sheet)
        // getRange(row: number, column: number, numRows: number, numColumns: number): FRange;
        const selection = sheet.getRange(rangeNumber.startRow, rangeNumber.startCol, rangeNumber.endRow - rangeNumber.startRow + 1, rangeNumber.endCol - rangeNumber.startCol + 1)
        sheet.setActiveSelection(selection)

        const GAP = 1
        this.univerAPI.executeCommand(ScrollToRangeOperation.id, {
          range: {
            startRow: Math.max(selection.getRow() - GAP, 0),
            endRow: selection.getRow() + selection.getHeight() + GAP,
            startColumn: selection.getColumn(),
            endColumn: selection.getColumn() + selection.getWidth() + GAP,
          },
        })
      }, 1000)
    }
  }

  setViewData(data: string, _: boolean): void {
    this.data = data

    this.app.workspace.onLayoutReady(async () => {
      // console.log("setViewData", data);
      this.setupUniver()
      this.scrollToRange()
    })
  }

  copyToHTML() {
    const workbook = this.univerAPI.getActiveWorkbook()

    const workbookData = workbook?.getSnapshot()
    if (workbookData === undefined)
      return

    const sheet = workbook?.getActiveSheet()
    if (sheet === null || sheet === undefined)
      return

    const range = sheet?.getSelection()?.getActiveRange()
    if (range === null || range === undefined)
      return

    const rangeString = rangeToRangeString(range)
    const html = renderToHtml(workbookData, sheet.getSheetName(), rangeString)
    const htmlString = html.outerHTML
    // console.log("htmlString", html, htmlString)
    navigator.clipboard.writeText(htmlString)
    new Notice(t('COPY_TO_HTML_SUCCESS'))
  }
}
