import './style/univer.css'
import './utils/polyfill'
import type {
  CachedMetadata,
  Menu,
  MenuItem,
  ViewState,
} from 'obsidian'
import {
  MarkdownView,
  Plugin,
  TAbstractFile,
  TFile,
  Workspace,
  WorkspaceLeaf,
  normalizePath,
} from 'obsidian'

import { around, dedupe } from 'monkey-around'
import { update } from '@ljcoder/authorization'
import { log } from '@ljcoder/smart-sheet/src/utils/log'
import {
  DEFAULT_CONTENT,
  FRONTMATTER,
  FRONTMATTER_KEY,
  VIEW_TYPE_EXCEL_PRO,
} from './common/constants'
import { ExcelProView } from './views/ExcelProView'
import type { ExcelProSettings } from './common/setting'
import { DEFAULT_SETTINGS } from './common/setting'
import {
  checkAndCreateFolder,
  getExcelFilename,
  getNewUniqueFilepath,
} from './utils/file'
import type { PaneTarget } from './common/modifierkey-helper'
import { t } from './lang/helpers'
import { ExcelProSettingTab } from './settingTab'
import {
  initializeMarkdownPostProcessor,
  markdownPostProcessor,
} from './post-processor/markdownPostProcessor'
import { DataService } from './services/data.service'

export default class ExcelProPlugin extends Plugin {
  public settings: ExcelProSettings
  private _loaded = false

  async onload() {
    // 加载设置
    await this.loadSettings()

    this.addSettingTab(new ExcelProSettingTab(this.app, this))

    this.registerView(
      VIEW_TYPE_EXCEL_PRO,
      (leaf: WorkspaceLeaf) => new ExcelProView(leaf, this),
    )
    this.registerExtensions(['univer'], VIEW_TYPE_EXCEL_PRO)

    // This creates an icon in the left ribbon.
    this.addRibbonIcon('sheet', t('CREATE_EXCEL'), () => {
      // Called when the user clicks the icon.
      this.createAndOpenExcel(
        getExcelFilename(this.settings),
        undefined,
        this.getBlackData(),
      )
    })

    // markdwon后处理
    this.addMarkdownPostProcessor()

    // inspiration taken from kanban: https://github.com/mgmeyers/obsidian-kanban/blob/44118e25661bff9ebfe54f71ae33805dc88ffa53/src/main.ts#L267
    this.registerMonkeyPatches()

    this.switchToExcelAfterLoad()

    this.registerEventListeners()

    this.registerCommands()
  }

  onunload() {
    // 解决 Redi 重复注入报错
    // @ts-expect-error
    window.RediContextCreated = false
    // @ts-expect-error
    window.REDI_GLOBAL_LOCK = false
  }

  private getBlackData() {
    return FRONTMATTER + DEFAULT_CONTENT
  }

  private addMarkdownPostProcessor() {
    // console.log("addMarkdownPostProcessor--------")
    initializeMarkdownPostProcessor(this)
    this.registerMarkdownPostProcessor(markdownPostProcessor)
  }

  private registerEventListeners() { }

  private switchToExcelAfterLoad() {
    this.app.workspace.onLayoutReady(() => {
      let leaf: WorkspaceLeaf
      const markdownLeaf = this.app.workspace.getLeavesOfType('markdown')
      for (leaf of markdownLeaf) {
        if (
          leaf.view instanceof MarkdownView
          && leaf.view.file
          && this.isExcelFile(leaf.view.file)
        ) {
          this.setExcelView(leaf)
        }
      }
    })

    // 监听文件改名
    this.registerEvent(
      this.app.vault.on('rename', async (file, oldPath) => {
        if (file instanceof TAbstractFile) {
          await this.updateBacklinks(file, oldPath)
        }
      }),
    )
  }

  /**
   * 找到所有引用 oldPath 的文件并更新
   * newFile: 链接更新后的文件
   * oldPath: 链接旧路径
   */
  private async updateBacklinks(newFile: TAbstractFile, oldPath: string) {
    const links = this.app.metadataCache.resolvedLinks
    for (const [sourcePath, targets] of Object.entries(links)) {
      if (targets[oldPath]) {
        const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath)
        if (sourceFile instanceof TFile && this.isExcelFile(sourceFile)) {
          await this.updateLinksInFile(sourceFile, newFile, oldPath)
        }
      }
    }
  }

  /**
   * 更新单个文件中的链接
   * file: 需要更新链接的文件
   * newFile: 链接更新后的文件
   * oldPath: 链接旧路径
   */
  private async updateLinksInFile(file: TFile, newFile: TAbstractFile, oldPath: string) {
    const cache: CachedMetadata | null = this.app.metadataCache.getFileCache(file)
    if (!cache?.links && !cache?.embeds)
      return

    const content = await this.app.vault.read(file)
    const dataService = new DataService(file, content)
    log('[main]', 'updateLinksInFile', dataService, newFile.path, oldPath)
    dataService.updateSheetOutgoingLinks(newFile.path, oldPath)
    const oldLinkText = this.app.metadataCache.fileToLinktext(
      { path: oldPath } as TFile, // fake TFile object with path
      '', // sourcePath: empty = vault root
      true, // true = use shortest path
    )
    dataService.updateOutgoingLink(newFile.path, oldLinkText)
    log('[main]', 'updateLinksInFile after', dataService, oldLinkText)

    const updated = dataService.stringifyMarkdown()

    if (updated) {
      await this.app.vault.modify(file, updated)
      log('[main]', `✅ Updated links in: ${file.path}`)
    }
  }

  async loadSettings() {
    const settingData = await this.loadData()
    this.settings = Object.assign({}, DEFAULT_SETTINGS, settingData)
    update(this.settings.authorizationCode, () => {})
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  private registerCommands() {
    const fileMenuHandlerCreateNew = (menu: Menu, file: TFile) => {
      menu.addItem((item: MenuItem) => {
        item
          .setTitle(t('CREATE_EXCEL'))
          .setIcon('sheet')
          .onClick(() => {
            let filepath = file.path
            if (file instanceof TFile) {
              filepath = normalizePath(
                file.path.substr(0, file.path.lastIndexOf(file.name)),
              )
            }
            this.createAndOpenExcel(getExcelFilename(this.settings), filepath)
          })
      })
    }

    this.registerEvent(
      this.app.workspace.on('file-menu', fileMenuHandlerCreateNew),
    )
    this.addCommand({
      id: 'spreadsheet-autocreation',
      icon: 'sheet',
      name: t('CREATE_EXCEL'),
      callback: () => {
        this.createAndOpenExcel(
          getExcelFilename(this.settings),
          undefined,
          this.getBlackData(),
        )
      },
    })
  }

  private registerMonkeyPatches() {
    const key = 'https://gitee.com/ljcoder2015/obsidian-excel-pro'
    this.register(
      around(Workspace.prototype, {
        getActiveViewOfType(old) {
          return dedupe(key, old, function (...args) {
            const result = old && old.apply(this, args)

            const maybeSheetView = this.app?.workspace?.activeLeaf?.view
            if (!maybeSheetView || !(maybeSheetView instanceof ExcelProView))
              return result
          })
        },
      }),
    )

    // @ts-expect-error
    if (!this.app.plugins?.plugins?.['obsidian-hover-editor']) {
      this.register(
        // stolen from hover editor
        around(WorkspaceLeaf.prototype, {
          getRoot(old) {
            return function () {
              const top = old.call(this)
              return top.getRoot === this.getRoot ? top : top.getRoot()
            }
          },
        }),
      )
    }

    const self = this
    // Monkey patch WorkspaceLeaf to open Excel with ExcelProView by default
    this.register(
      around(WorkspaceLeaf.prototype, {
        // Excel can be viewed as markdown or Excalidraw, and we keep track of the mode
        // while the file is open. When the file closes, we no longer need to keep track of it.
        detach(next) {
          return function () {
            return next.apply(this)
          }
        },

        setViewState(next) {
          return function (state: ViewState, ...rest: any[]) {
            // console.log("setViewState state ===", state)
            if (
              self._loaded
              // If we have a markdown file
              && state.type === 'markdown'
              && state.state?.file
            ) {
              const filepath: string = state.state.file as string
              // Then check for the excalidraw frontMatterKey
              const cache = self.app.metadataCache.getCache(filepath)

              // console.log("setViewState cache cccc", cache)
              if (
                (cache?.frontmatter && cache?.frontmatter[FRONTMATTER_KEY])
                || filepath.contains('.univer.md')
              ) {
                // console.log("setViewState --", cache)
                // If we have it, force the view type to excalidraw
                const newState = {
                  ...state,
                  type: VIEW_TYPE_EXCEL_PRO,
                }

                return next.apply(this, [newState, ...rest])
              }
            }

            return next.apply(this, [state, ...rest])
          }
        },
      }),
    )
  }

  public async setExcelView(leaf: WorkspaceLeaf) {
    await leaf.setViewState({
      type: VIEW_TYPE_EXCEL_PRO,
      state: leaf.view.getState(),
      popstate: true,
    } as ViewState)
  }

  public async createExcel(
    filename: string,
    foldername?: string,
    initData?: string,
  ): Promise<TFile> {
    const folderpath = normalizePath(
      foldername || this.settings.folder,
    )
    await checkAndCreateFolder(this.app.vault, folderpath)

    const fname = getNewUniqueFilepath(this.app.vault, filename, folderpath)
    const file = await this.app.vault.create(
      fname,
      initData ?? this.getBlackData(),
    )

    return file
  }

  public async createAndOpenExcel(
    filename: string,
    foldername?: string,
    initData?: string,
  ): Promise<string> {
    const file = await this.createExcel(filename, foldername, initData)
    this.openExcel(file, 'new-pane', true, undefined)
    return file.path
  }

  public openExcel(
    excelFile: TFile,
    location: PaneTarget,
    active = false,
    subpath?: string,
  ) {
    if (location === 'md-properties')
      location = 'new-tab'

    let leaf: WorkspaceLeaf | null = null
    if (location === 'popout-window')
      leaf = this.app.workspace.openPopoutLeaf()

    if (location === 'new-tab')
      leaf = this.app.workspace.getLeaf('tab')

    if (!leaf) {
      leaf = this.app.workspace.getLeaf(false)
      if (leaf.view.getViewType() !== 'empty' && location === 'new-pane')
        leaf = this.app.workspace.getMostRecentLeaf()
    }

    leaf
      ?.openFile(
        excelFile,
        !subpath || subpath === ''
          ? { active, state: { type: VIEW_TYPE_EXCEL_PRO } }
          : {
              active,
              eState: { subpath },
              state: { type: VIEW_TYPE_EXCEL_PRO },
            },
      )
      .then(() => {
        if (leaf)
          this.setExcelView(leaf)
      })
  }

  public isExcelFile(f: TFile) {
    if (!f)
      return false
    if (f.extension === 'univer')
      return true

    const fileCache = f ? this.app.metadataCache.getFileCache(f) : null
    return (
      !!fileCache?.frontmatter && !!fileCache?.frontmatter[FRONTMATTER_KEY]
    )
  }
}
