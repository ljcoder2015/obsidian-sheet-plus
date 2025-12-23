import type { Vault, WorkspaceLeaf } from 'obsidian'
import { Notice, TFile, TextFileView } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { emitEvent } from '@ljcoder/smart-sheet'
import type ExcelProPlugin from '../main'

import { DEFAULT_CONTENT, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { EditorContext } from '../context/editorContext'
import { DataService } from '../services/data.service'
import type { ViewSemaphores } from '../utils/types'
import { log, warn } from '../utils/log'
import { UniverProvider } from '../context/UniverContext'
import type { ContainerViewRef } from './ContainerView'
import { ContainerView } from './ContainerView'

export class ExcelProView extends TextFileView {
  root: Root | null = null
  private containerRef = React.createRef<ContainerViewRef>()
  public plugin: ExcelProPlugin
  public copyHTMLEle: HTMLElement | undefined
  public statusBarItem: HTMLElement | undefined

  public subPath: string | null = null

  public dataService: DataService | null = null
  private lastLoadedFile: TFile | null = null

  public semaphores: ViewSemaphores = {
    embeddableIsEditingSelf: false,
    popoutUnload: false,
    viewloaded: false,
    viewunload: false,
    saving: false,
    unloadFileSaving: false,
  }

  constructor(leaf: WorkspaceLeaf, plugin: ExcelProPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  setViewData(data: string, _: boolean): void {
    if (this.file == null) {
      return
    }
    this.lastLoadedFile = this.file
    this.data = data
    this.dataService = new DataService(this.file, this.data)
    log('[ExcelProView]', 'setViewData', this.dataService)

    this.plugin.app.workspace.onLayoutReady(async () => {
      let counter = 0
      while ((!this.semaphores?.viewloaded || !this.file) && counter++ < 50) await sleep(50)
      this.renderContent()
    })
  }

  async waitSaveData(file: TFile) {
    this.semaphores.unloadFileSaving = true
    emitEvent('unloadFile', { filePath: file.path })
    let counter = 0
    while (this.semaphores.unloadFileSaving && (counter < 200)) {
      await sleep(50) // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/1988
      counter++
      log('[ExcelProView]', new Date().toLocaleString(), '等待文件卸载完成', this.semaphores.unloadFileSaving)
    }
  }

  async onUnloadFile(file: TFile): Promise<void> {
    if (this.semaphores.viewunload) {
      return
    }
    log('[ExcelProView]', new Date().toLocaleString(), 'onUnloadFile', file.path)
    await this.waitSaveData(file)
    this.dispose()
  }

  onload(): void {
    super.onload()
    this.semaphores.viewloaded = true
    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ => this.copyToHTML())
  }

  onunload() {
    log('[ExcelProView]', new Date().toLocaleString(), 'onunload')
    this.semaphores.viewunload = true
    if (this.file) {
      emitEvent('unloadFile', { filePath: this.file.path })
    }
    this.dispose()
  }

  clear(): void {
    this.dataService = null
  }

  dispose() {
    log('[ExcelProView]', 'ExcelProView调用dispose', this.containerRef)
    this.dataService = null
    this.root?.unmount()
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  async save() {
    if (this.semaphores.saving) {
      log('[ExcelProView]', '保存中,取消保存')
      return
    }
    this.semaphores.saving = true

    if (!this.file
      || this.lastLoadedFile !== this.file
      || !this.app.vault.getAbstractFileByPath(this.file.path)
      || !this.dataService
    ) {
      this.semaphores.saving = false
      this.semaphores.unloadFileSaving = false
      return
    }

    try {
      // added this to avoid Electron crash when terminating a popout window and saving the drawing, need to check back
      // can likely be removed once this is resolved: https://github.com/electron/electron/issues/40607
      if (this.semaphores.viewunload) {
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
        this.semaphores.unloadFileSaving = false
        return
      }

      this.data = this.dataService.stringifyMarkdown() ?? DEFAULT_CONTENT
      log('[ExcelProView]', '保存数据到文件', this.file.path, this.dataService?.file.path)
      super.save()
    }
    catch (e) {
      console.error({
        where: 'SheetPlus.save',
        fn: this.save,
        error: e,
      })
    }
    finally {
      this.semaphores.saving = false
      this.semaphores.unloadFileSaving = false
    }
  }

  async saveData(data: any, key: string) {
    if (!this.dataService) {
      return
    }
    if (key === 'sheet') {
      if (data.name !== this.file?.path) {
        warn('[ExcelProView]', '保存数据出错', 'sheet name not match, data name:', data.name, 'file path:', this.file?.path)
        new Notice(`${t('SHEET_NAME_NOT_MATCH')}: ${data.name}.`)
        return
      }
    }
    const lastData = this.dataService.getBlock(key)
    log('[ExcelProView]', '开始保存数据到 data service', key)
    if (JSON.stringify(lastData) === JSON.stringify(data)) {
      this.semaphores.unloadFileSaving = false
      log('[ExcelProView]', new Date().toLocaleString(), '数据没改变不保存', this.semaphores.unloadFileSaving)
      return
    }
    this.dataService.setBlock(key, data)
    await this.save()
  }

  getFileByPath(path: string, vault: Vault): TFile | null {
    const abstractFile = vault.getAbstractFileByPath(path)
    if (abstractFile instanceof TFile) {
      return abstractFile
    }
    return null
  }

  async deleteData(key: string) {
    this.dataService?.deleteBlock(key)
    log('[ExcelProView]', 'deleteData', key)
    await this.save()
  }

  renderContent() {
    this.contentEl.style.padding = '0'
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
    return this.dataService?.stringifyMarkdown() ?? this.data
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
