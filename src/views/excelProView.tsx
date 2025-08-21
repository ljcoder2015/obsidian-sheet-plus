import type { TFile, WorkspaceLeaf } from 'obsidian'
import { Notice, TextFileView } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import type { FUniver } from '@univerjs/core/facade'
import type ExcelProPlugin from '../main'
import { renderToHtml } from '../post-processor/html'

import type {
  ParsedMarkdown,
} from '../utils/data'

import {
  parseMarkdown,
  rangeToRangeString,
} from '../utils/data'
import { FRONTMATTER, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { AppContext } from '../context/appContext'
import { PluginContext } from '../context/pluginContext'
import { ContentView } from './ContentView'

export class ExcelProView extends TextFileView {
  root: Root | null = null
  public plugin: ExcelProPlugin
  public loadingEle: HTMLElement
  public copyHTMLEle: HTMLElement
  public univerAPI: FUniver | null = null

  public subPath: string | null = null

  public markdownData: ParsedMarkdown | null = null

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  onLoadFile(file: TFile): Promise<void> {
    // console.log('onLoadFile', file.name)
    return super.onLoadFile(file)
  }

  setViewData(data: string, _: boolean): void {
    // console.log('setViewData')
    this.data = data
    this.markdownData = parseMarkdown(this.data)
    this.renderContent()
  }

  onUnloadFile(file: TFile): Promise<void> {
    // console.log('onUnloadFile', file.name)
    this.root?.unmount()
    return super.onUnloadFile(file)
  }

  onload(): void {
    super.onload()

    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ => this.copyToHTML())
  }

  onunload(): void {
    // console.log('onunload', file.name)
    this.dispose()
  }

  dispose() {
    this.root?.unmount()
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  renderContent() {
    this.contentEl.empty()
    this.root = createRoot(this.contentEl)
    this.root.render(
      <AppContext.Provider value={this.app}>
        <PluginContext.Provider value={this}>
          <ContentView />
        </PluginContext.Provider>
      </AppContext.Provider>,
    )
  }

  getViewData(): string {
    return this.data
  }

  headerData() {
    let header = this.markdownData.header.raw

    if (header == null) {
      header = FRONTMATTER
    }

    return header
  }

  clear(): void {
    this.data = this.headerData()
  }

  setEphemeralState(state: any): void {
    if (state.subpath) {
      const path = state.subpath as string
      this.subPath = path
    }
  }

  copyToHTML() {
    if (this.univerAPI === null) {
      return
    }
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
