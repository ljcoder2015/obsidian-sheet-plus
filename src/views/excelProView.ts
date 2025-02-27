import type { TFile, WorkspaceLeaf } from 'obsidian'
import { Notice, TextFileView } from 'obsidian'
import type { IWorkbookData, Univer, Workbook } from '@univerjs/core'
import { CommandType, LifecycleStages, UniverInstanceType } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
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
  public loadingEle: HTMLElement
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

  onLoadFile(file: TFile): Promise<void> {
    // console.log('onLoadFile', file.name, this.containerEl)
    this.createUniverEl()
    return super.onLoadFile(file)
  }

  setViewData(data: string, _: boolean): void {
    this.data = data

    this.app.workspace.onLayoutReady(async () => {
      // console.log("setViewData");
      this.setupUniver()
    })
  }

  onUnloadFile(file: TFile): Promise<void> {
    // console.log('onUnloadFile', file.name)
    // 释放 univer 相关对象
    this.dispose()
    return super.onUnloadFile(file)
  }

  onload(): void {
    super.onload()

    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ =>
      this.copyToHTML())

    this.createUniverEl()
  }

  dispose() {
    // 释放 univer !无需手动调用
    // this.univer?.dispose()

    // this.univer = null
    // this.univerAPI = null

    this.subPath = null
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  createUniverEl() {
    this.contentEl.empty()
    const sheetContainer = this.contentEl.createDiv({
      cls: 'sheet-container',
    })

    // 添加加载遮罩
    this.loadingEle = sheetContainer.createDiv({
      cls: 'sheet-loading-overlay',
    })

    const textEl = this.loadingEle.createEl('p', {
      cls: 'loading-text',
      text: t('LOADING'),
    })

    textEl.createSpan({ text: '.' })
    textEl.createSpan({ text: '.' })
    textEl.createSpan({ text: '.' })
    textEl.createSpan({ text: '.' })

    this.sheetEle = sheetContainer.createDiv({
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
    this.univerId = id
  }

  setupUniver() {
    // 设置多语言
    const options = {
      header: true,
      footer: true,
    }

    this.univer = createUniver(options, this.univerId, this.plugin.settings.mobileRenderMode)
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

    this.univerAPI.addEvent(this.univerAPI.Event.LifeCycleChanged, (res) => {
      if (res.stage === LifecycleStages.Rendered) {
        this.loadingEle.remove()
      }
    })

    this.univerAPI.addEvent(this.univerAPI.Event.CommandExecuted, (res) => {
      if (res.type !== CommandType.MUTATION) {
        return
      }

      const activeWorkbook = this.univerAPI.getActiveWorkbook()
      if (!activeWorkbook) {
        return
      }

      const activeWorkbookData = JSON.stringify(activeWorkbook.save())

      if (this.lastWorkbookData === null) {
        // 第一次加载不处理
        this.lastWorkbookData = activeWorkbookData
        return
      }

      if (this.lastWorkbookData === activeWorkbookData) {
        // 没变化不处理
        return
      }

      // console.log("\n===command===", command)

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
        new Notice(t('SAVE_DATA_ERROR'))
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
