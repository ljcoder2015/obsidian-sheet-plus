import type { Vault, WorkspaceLeaf } from 'obsidian'
import { Notice, Platform, TFile, TextFileView, debounce } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { emitEvent } from '@ljcoder/smart-sheet'
import { error } from '@ljcoder/smart-sheet/src/utils/log'
import type ExcelProPlugin from '../main'

import { BLANK_CONTENT, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { EditorContext } from '../context/editorContext'
import type { ViewSemaphores } from '../utils/types'
import { log, warn } from '../utils/log'
import { UniverProvider } from '../context/UniverContext'
import type { SheetStoreState } from '../services/reduce'
import { toMarkdown, toStoreState } from '../services/utils'
import { SheetStoreProvider } from '../context/SheetStoreProvider'
import { ContainerView } from './ContainerView'

export class ExcelProView extends TextFileView {
  root: Root | null = null
  public plugin: ExcelProPlugin
  public renderModeEle: HTMLElement | undefined
  public statusBarItem: HTMLElement | undefined

  public subPath: string | null = null

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
    this.autoSaveItem?.setText(t('AUTO_SAVE_IDLE'))
    this.lastLoadedFile = this.file
    this.data = data
    this.initData = toStoreState(this.data, this.file.path)

    log('[ExcelProView]', 'setViewData', this.initData)

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
    this.autoSaveItem = this.plugin.addStatusBarItem()

    if (Platform.isMobile) {
      this.renderModeEle = this.addAction('monitor-smartphone', t('CHANGE_RENDER_MODE'), _ => this.changeRenderMode())
    }
  }

  onunload() {
    log('[ExcelProView]', new Date().toLocaleString(), 'onunload')
    this.semaphores.viewunload = true
    this.debounced.run()
    this.autoSaveItem?.remove()

    this.dispose()
  }

  changeRenderMode() {
    if (this.plugin.settings.mobileRenderMode === 'mobile') {
      this.plugin.settings.mobileRenderMode = 'desktop'
    }
    else {
      this.plugin.settings.mobileRenderMode = 'mobile'
    }
    this.plugin.saveSettings()

    // 将 unmount 和 renderContent 包装在 setTimeout 中，确保在当前渲染周期完成后执行
    setTimeout(() => {
      this.root?.unmount()
      this.renderContent()
    }, 0)
  }

  clear(): void {
    this.data = BLANK_CONTENT
  }

  dispose() {
    log('[ExcelProView]', 'ExcelProView调用dispose')
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
          log('[ExcelProView]', '异步modify文件', file.path)
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
      this.data = toMarkdown(this.lastChangeState) ?? BLANK_CONTENT
      log('[ExcelProView]', '保存数据到文件', this.file.path, this.lastChangeState.sheet?.name)
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
      this.autoSaveItem?.setText(t('AUTO_SAVE_IDLE'))
      log('[ExcelProView]', '数据未改变,不保存', state, this.initData)
      return
    }
    log('[ExcelProView]', 'debounceSave', this.lastChangeState === this.initData, this.lastChangeState, this.initData)
    this.autoSaveItem?.setText(t('AUTO_SAVE_SAVING'))
    try {
      await this.save()
      this.autoSaveItem?.setText(t('AUTO_SAVE_SAVED').replace('{{time}}', new Date().toLocaleString()))
    }
    catch (e) {
      new Notice(t('AUTO_SAVE_FAILED_MSG').replace('{{error}}', String(e)))
      this.autoSaveItem?.setText(t('AUTO_SAVE_FAILED'))
    }
  }, 30_000)

  private onDataChange = (state: SheetStoreState) => {
    this.autoSaveItem?.setText(t('AUTO_SAVE_WAITING'))
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
            <ContainerView />
          </UniverProvider>
        </EditorContext.Provider>
      </SheetStoreProvider>
    )
  }

  getViewData(): string {
    return this.lastChangeState ? toMarkdown(this.lastChangeState) ?? BLANK_CONTENT : this.data
  }

  setEphemeralState(state: any): void {
    if (state.subpath) {
      const path = state.subpath as string
      this.subPath = path
    }
  }
}
