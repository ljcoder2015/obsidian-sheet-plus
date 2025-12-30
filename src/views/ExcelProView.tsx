import type { Vault, WorkspaceLeaf } from 'obsidian'
import { Notice, TFile, TextFileView, debounce } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { emitEvent } from '@ljcoder/smart-sheet'
import { error } from '@ljcoder/smart-sheet/src/utils/log'
import type ExcelProPlugin from '../main'

import { DEFAULT_CONTENT, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { EditorContext } from '../context/editorContext'
import { DataService } from '../services/data.service'
import type { ViewSemaphores } from '../utils/types'
import { log, warn } from '../utils/log'
import { UniverProvider } from '../context/UniverContext'
import type { SheetStoreState } from '../services/reduce'
import { toMarkdown, toStoreState } from '../services/utils'
import { SheetStoreProvider } from '../context/SheetStoreProvider'
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

  private autoSaveItem: HTMLElement | undefined
  private initData: SheetStoreState | undefined
  private lastChangeState: SheetStoreState | undefined

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
    this.autoSaveItem?.setText('自动保存: 空闲')
    this.lastLoadedFile = this.file
    this.data = data
    this.dataService = new DataService(this.file, this.data)
    this.initData = toStoreState(this.data, this.file.path)

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
    this.debounced.run()
    this.dispose()
  }

  onload(): void {
    log('[ExcelProView]', 'onload')
    super.onload()
    this.semaphores.viewloaded = true
    this.copyHTMLEle = this.addAction('file-code', t('COPY_TO_HTML'), _ => this.copyToHTML())
    this.autoSaveItem = this.plugin.addStatusBarItem()
  }

  onunload() {
    log('[ExcelProView]', new Date().toLocaleString(), 'onunload')
    this.semaphores.viewunload = true
    this.debounced.run()
    this.autoSaveItem?.remove()

    this.dispose()
  }

  clear(): void {
    this.data = DEFAULT_CONTENT
  }

  dispose() {
    log('[ExcelProView]', 'ExcelProView调用dispose', this.containerRef)
    this.lastChangeState = undefined
    this.root?.unmount()
  }

  getViewType(): string {
    return VIEW_TYPE_EXCEL_PRO
  }

  async save() {
    log('[ExcelProView]', 'save')
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
          if (!d) {
            return
          }
          log('[ExcelProView]', '异步modify文件', file.path, d)
          await plugin.app.vault.modify(file, d)
          // this is a shady edge case, don't scrifice the BAK file in case the drawing is empty
          // await imageCache.addBAKToCache(file.path,d);
        }, 200)
        this.semaphores.saving = false
        this.semaphores.unloadFileSaving = false
        return
      }

      if (!this.lastChangeState) {
        this.semaphores.saving = false
        this.semaphores.unloadFileSaving = false
        error('[ExcelProView]', '保存数据出错', 'lastChangeState is undefined')
        return
      }
      this.data = toMarkdown(this.lastChangeState) ?? DEFAULT_CONTENT
      log('[ExcelProView]', '保存数据到文件', this.file.path, this.dataService?.file.path)
      super.save()
    }
    catch (e) {
      console.error({
        where: 'SheetPlus.save',
        fn: this.save,
        error: e,
      })
      throw e
    }
    finally {
      this.semaphores.saving = false
      this.semaphores.unloadFileSaving = false
    }
  }

  private debounced = debounce(async (state: SheetStoreState) => {
    this.lastChangeState = state
    if (JSON.stringify(state) === JSON.stringify(this.initData)) {
      this.autoSaveItem?.setText('自动保存: 空闲')
      log('[ExcelProView]', '数据未改变,不保存', state, this.initData)
      return
    }
    log('[ExcelProView]', 'debounceSave', this.lastChangeState === this.initData, this.lastChangeState, this.initData)
    this.autoSaveItem?.setText('自动保存: 保存中')
    try {
      await this.save()
      this.autoSaveItem?.setText(`自动保存: 已保存 ${new Date().toLocaleString()}`)
    }
    catch (e) {
      new Notice(`自动保存: 保存失败 ${e}`)
      this.autoSaveItem?.setText(`自动保存: 保存失败`)
    }
  }, 30_000)

  private onDataChange = (state: SheetStoreState) => {
    this.autoSaveItem?.setText('自动保存: 等待中')
    log('[ExcelProView]', 'onDataChange', state)
    this.debounced(state)
  }

  renderContent() {
    this.contentEl.style.padding = '0'
    this.root = createRoot(this.contentEl)
    this.root.render(
      <SheetStoreProvider
        initialState={this.initData}
        onChange={this.onDataChange}
      >
        <EditorContext.Provider value={{ app: this.app, editor: this }}>
          <UniverProvider>
            <ContainerView dataService={this.dataService} />
          </UniverProvider>
        </EditorContext.Provider>
        ,
      </SheetStoreProvider>,
    )
  }

  getViewData(): string {
    return this.data
  }

  setEphemeralState(state: any): void {
    if (state.subpath) {
      const path = state.subpath as string
      this.subPath = path
    }
  }

  copyToHTML() {
    // this.containerRef.current?.copyToHTML()
  }
}
