import type { TFile, WorkspaceLeaf } from 'obsidian'
import { Notice, TextFileView } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import type { FUniver } from '@univerjs/core/facade'
import type ExcelProPlugin from '../main'
import { renderToHtml } from '../post-processor/html'

import {
  rangeToRangeString,
} from '../utils/data'
import { VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { AppContext } from '../context/appContext'
import { PluginContext } from '../context/pluginContext'
import { DataService } from '../services/data.service'
import type { ViewSemaphores } from '../utils/types'
import { ContentView } from './ContentView'

export class ExcelProView extends TextFileView {
  root: Root | null = null
  public plugin: ExcelProPlugin
  public loadingEle: HTMLElement
  public copyHTMLEle: HTMLElement
  public univerAPI: FUniver | null = null

  public subPath: string | null = null

  public dataService: DataService | null = null
  private lastLoadedFile: TFile | null = null

  public semaphores: ViewSemaphores | null = {
    embeddableIsEditingSelf: false,
    popoutUnload: false,
    viewloaded: false,
    viewunload: false,
    preventReload: false,
    saving: false,
  }

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  setViewData(data: string, _: boolean): void {
    // console.log('setViewData')
    this.data = data
    this.dataService = new DataService(this.data)

    this.app.workspace.onLayoutReady(async () => {
      let counter = 0
      while ((!this.semaphores.viewloaded || !this.file) && counter++ < 50) await sleep(50)
      this.renderContent()
    })
  }

  async onUnloadFile(file: TFile): Promise<void> {
    let counter = 0
    while (this.semaphores.saving && (counter++ < 200)) {
      await sleep(50) // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/1988
      if (counter++ === 15) {
        new Notice(t('SAVE_IS_TAKING_LONG'))
      }
      if (counter === 80) {
        new Notice(t('SAVE_IS_TAKING_VERY_LONG'))
      }
    }
    if (counter >= 200) {
      new Notice('Unknown error, save is taking too long')
    }
    this.dispose()
  }

  onload(): void {
    super.onload()
    this.semaphores.viewloaded = true
    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ => this.copyToHTML())
  }

  onunload(): void {
    this.semaphores.viewunload = true
    this.dispose()
  }

  dispose() {
    this.root?.unmount()
    this.univerAPI?.dispose()
    this.contentEl.empty()
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  public setPreventReload() {
    this.semaphores.preventReload = true
  }

  public async reload(fullreload: boolean = false, file?: TFile) {
    const loadOnModifyTrigger = file && file === this.file

    // once you've finished editing the embeddable, the first time the file
    // reloads will be because of the embeddable changed the file,
    // there is a 2000 ms time window allowed for this, but typically this will
    // happen within 100 ms. When this happens the timer is cleared and the
    // next time reload triggers the file will be reloaded as normal.
    if (this.semaphores.embeddableIsEditingSelf) {
      if (loadOnModifyTrigger) {
        this.data = await this.app.vault.read(this.file)
        this.dataService = new DataService(this.data)
      }
      return
    }
    // console.log("reload - embeddable is not editing")

    if (this.semaphores.preventReload) {
      this.semaphores.preventReload = false
      return
    }
    if (this.semaphores.saving)
      return
    this.lastLoadedFile = null

    if (!this.file) {
      return
    }

    if (loadOnModifyTrigger) {
      this.data = await this.app.vault.read(file)
      this.dataService = new DataService(this.data)
    }
  }

  async save() {
    if (this.semaphores.saving) {
      return
    }
    this.semaphores.saving = true

    // if there were no changes to the file super save will not save
    // and consequently main.ts modifyEventHandler will not fire
    // this.reload will not be called
    // triggerReload is used to flag if there were no changes but file should be reloaded anyway
    const triggerReload: boolean = false

    if (!this.file
      || !this.app.vault.getAbstractFileByPath(this.file.path) // file was recently deleted
    ) {
      this.semaphores.saving = false
      return
    }

    try {
      // added this to avoid Electron crash when terminating a popout window and saving the drawing, need to check back
      // can likely be removed once this is resolved: https://github.com/electron/electron/issues/40607
      if (this.semaphores?.viewunload) {
        const d = this.getViewData()
        const plugin = this.plugin
        const file = this.file
        window.setTimeout(async () => {
          if (!d)
            return
          await plugin.app.vault.modify(file, d)
          // this is a shady edge case, don't scrifice the BAK file in case the drawing is empty
          // await imageCache.addBAKToCache(file.path,d);
        }, 200)
        this.semaphores.saving = false
        return
      }

      this.data = this.dataService.stringifyMarkdown()
      await super.save()
    }
    catch (e) {
      console.error({
        where: 'SheetPlus.save',
        fn: this.save,
        error: e,
      })
    }
    this.semaphores.saving = false
    if (triggerReload) {
      this.reload(true, this.file)
    }
  }

  saveData(data: any, key: string) {
    this.dataService?.setBlock(key, data)
    this.save()
  }

  renderContent() {
    this.root = createRoot(this.contentEl)
    this.root.render(
      <AppContext.Provider value={this.app}>
        <PluginContext.Provider value={this}>
          <ContentView dataService={this.dataService} />
        </PluginContext.Provider>
      </AppContext.Provider>,
    )
  }

  async prepareGetViewData(): Promise<void> {
    this.dataService = new DataService(this.data)
  }

  getViewData(): string {
    return this.dataService.stringifyMarkdown() ?? this.data
  }

  clear(): void {
    this.dataService?.clear()
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
