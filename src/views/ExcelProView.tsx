import type { TFile, WorkspaceLeaf } from 'obsidian'
import { Notice, TextFileView } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import type ExcelProPlugin from '../main'

import { VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { EditorContext } from '../context/editorContext'
import { DataService } from '../services/data.service'
import type { ViewSemaphores } from '../utils/types'
import { log } from '../utils/log'
import { UniverProvider } from '../context/UniverContext'
import type { ContainerViewRef } from './ContainerView'
import { ContainerView } from './ContainerView'

export class ExcelProView extends TextFileView {
  root: Root | null = null
  private containerRef = React.createRef<ContainerViewRef>()
  public plugin: ExcelProPlugin
  public loadingEle: HTMLElement
  public copyHTMLEle: HTMLElement

  public subPath: string | null = null

  public dataService: DataService | null = null
  private lastLoadedFile: TFile | null = null

  public semaphores: ViewSemaphores | null = {
    embeddableIsEditingSelf: false,
    popoutUnload: false,
    viewloaded: false,
    viewunload: false,
    saving: false,
  }

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  setViewData(data: string, _: boolean): void {
    // console.log('setViewData')
    if (this.lastLoadedFile === this.file) {
      return
    }
    this.lastLoadedFile = this.file
    this.data = data
    this.dataService = new DataService(this.file.path, this.data)

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
    this.dataService = null
    this.root?.unmount()
    this.contentEl.empty()
    log('[ExcelProView]', 'ExcelProView调用dispose')
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  async save() {
    if (this.semaphores.saving) {
      return
    }
    this.semaphores.saving = true

    if (!this.file
      || this.lastLoadedFile !== this.file
      || !this.app.vault.getAbstractFileByPath(this.file.path) // file was recently deleted
      || this.dataService.fileName !== this.file.path
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
      log('[ExcelProView]', '保存数据到文件', this.file.name)
      super.save()
    }
    catch (e) {
      console.error({
        where: 'SheetPlus.save',
        fn: this.save,
        error: e,
      })
    }
    this.semaphores.saving = false
  }

  saveData(data: any, key: string) {
    if (!this.dataService) {
      return
    }
    this.dataService.setBlock(key, data)
    log('[ExcelProView]', 'saveData', key, this.dataService?.fileName)
    this.save()
  }

  deleteData(key: string) {
    this.dataService?.deleteBlock(key)
    log('[ExcelProView]', 'deleteData', key)
    this.save()
  }

  renderContent() {
    this.root = createRoot(this.contentEl)
    this.root.render(
      <EditorContext.Provider value={{ app: this.app, editor: this }}>
        <UniverProvider>
          <ContainerView ref={this.containerRef} dataService={this.dataService} />
        </UniverProvider>
      </EditorContext.Provider>,
    )
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
    this.containerRef.current?.copyToHTML()
  }
}
