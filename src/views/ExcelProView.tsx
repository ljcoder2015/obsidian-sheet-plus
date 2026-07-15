import type { TFile, WorkspaceLeaf } from 'obsidian'
import { Notice, Platform, TextFileView, debounce } from 'obsidian'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { emitEvent } from '@ljcoder/smart-sheet'
import { error } from '@ljcoder/smart-sheet/src/utils/log'
import { mcpService } from '@ljcoder/smart-sheet/src/mcp/McpService'
import type ExcelProPlugin from '../main'

import { BLANK_CONTENT, VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { EditorContext } from '../context/editorContext'
import type { ViewSemaphores } from '../utils/types'
import { log } from '../utils/log'
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

  // 定时器引用，用于清理
  private refreshTimer: number | null = null
  private asyncSaveTimer: number | null = null

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
      // 检查视图是否已卸载
      if (this.semaphores.viewunload) {
        return
      }
      let counter = 0
      while ((!this.semaphores?.viewloaded || !this.file) && counter++ < 50) await sleep(50)
      // 再次检查视图状态
      if (!this.semaphores.viewunload) {
        this.renderContent()
      }
    })
  }

  async waitSaveData(file: TFile) {
    this.semaphores.unloadFileSaving = true
    emitEvent('unloadFile', { filePath: file.path })
    let counter = 0
    while (this.semaphores.unloadFileSaving && (counter < 200)) {
      await sleep(50)
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

    if (!Platform.isDesktopApp) {
      this.renderModeEle = this.addAction('monitor-smartphone', t('CHANGE_RENDER_MODE'), _ => this.changeRenderMode())
    }
  }

  onunload() {
    log('[ExcelProView]', new Date().toLocaleString(), 'onunload')
    this.semaphores.viewunload = true

    // 立即执行待执行的 debounce 任务
    if (typeof this.debounced.run === 'function') {
      this.debounced.run()
    }

    // 清理定时器
    this.clearTimers()

    // 清理状态栏项
    this.autoSaveItem?.remove()

    // 关闭 MCP 服务
    try {
      mcpService.stop()
      log('[ExcelProView]', 'MCP service stopped')
    }
    catch (e) {
      log('[ExcelProView]', 'Error stopping MCP service', e)
    }

    this.dispose()
  }

  /**
   * 清理所有定时器
   */
  private clearTimers() {
    if (this.refreshTimer) {
      window.clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.asyncSaveTimer) {
      window.clearTimeout(this.asyncSaveTimer)
      this.asyncSaveTimer = null
    }
  }

  changeRenderMode() {
    if (this.plugin.settings.mobileRenderMode === 'mobile') {
      this.plugin.settings.mobileRenderMode = 'desktop'
    }
    else {
      this.plugin.settings.mobileRenderMode = 'mobile'
    }
    void this.plugin.saveSettings()

    this.refresh()
  }

  refresh() {
    // 清理之前的定时器
    this.clearTimers()

    // 将 unmount 和 renderContent 包装在 setTimeout 中，确保在当前渲染周期完成后执行
    this.refreshTimer = window.setTimeout(() => {
      if (this.semaphores.viewunload) {
        return
      }
      this.root?.unmount()
      this.root = null
      this.renderContent()
    }, 0)
  }

  clear(): void {
    this.data = BLANK_CONTENT
  }

  dispose() {
    log('[ExcelProView]', 'ExcelProView调用dispose')

    // 清理定时器
    this.clearTimers()

    // 清理 React root
    if (this.root) {
      this.root.unmount()
      this.root = null
    }

    // 清理状态
    this.lastChangeState = undefined
    this.initData = undefined
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
        fn: () => this.save(),
        error: e,
      })
      throw e
    }
    finally {
      this.semaphores.saving = false
      this.semaphores.unloadFileSaving = false
    }
  }

  public debounced = debounce(async (state: SheetStoreState) => {
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
    // 如果视图已卸载，不进行渲染
    if (this.semaphores.viewunload) {
      return
    }

    this.contentEl.addClass('lj-excel-pro-content')

    // 如果已有 root，先卸载
    if (this.root) {
      this.root.unmount()
    }

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
      </SheetStoreProvider>,
    )
  }

  getViewData(): string {
    return this.lastChangeState ? toMarkdown(this.lastChangeState) ?? BLANK_CONTENT : this.data
  }

  setEphemeralState(state: Record<string, unknown>): void {
    if (state.subpath) {
      const path = state.subpath as string
      this.subPath = path
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}
