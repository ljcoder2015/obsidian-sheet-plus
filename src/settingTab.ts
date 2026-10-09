import type { App, SettingDefinitionItem } from 'obsidian'
import { Notice, PluginSettingTab, Setting } from 'obsidian'
import { update } from '@ljcoder/authorization'
import { ConfigService } from '@univerjs/core'
import { FontService, UI_PLUGIN_CONFIG_KEY } from '@univerjs/ui'
import { t } from './lang/helpers'
import type ExcelProPlugin from './main'
import { VIEW_TYPE_EXCEL_PRO } from './common/constants'
import type { ExcelProView } from './views/ExcelProView'
import { buildFontConfigs } from './services/fontManager'
import { fragWithHTML } from './utils/tools'

export class ExcelProSettingTab extends PluginSettingTab {
  plugin: ExcelProPlugin

  constructor(app: App, plugin: ExcelProPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  // 默认字体下拉选项：与表格字体下拉同源——独立实例化 FontService，
  // 复用其「Univer 内置列表 + customFontFamily」合并逻辑，保证两处列表完全一致
  private getDefaultFontOptions(): Record<string, string> {
    const configService = new ConfigService()
    configService.setConfig(UI_PLUGIN_CONFIG_KEY, { customFontFamily: buildFontConfigs(this.plugin.availableFonts) })
    const fontService = new FontService(configService)
    try {
      const options: Record<string, string> = { '': t('DEFAULT_FONT_FAMILY_NONE') }
      for (const font of fontService.getFonts()) {
        options[font.value] = font.value
      }
      return options
    }
    finally {
      // 独立实例用完即弃：resetToDefaults + complete 订阅流，避免 Subject 泄漏
      fontService.dispose()
    }
  }

  // 字体目录输入防抖定时器：避免逐字符输入反复触发字体重扫与表格刷新
  private fontFolderDebounce?: number

  /**
   * 字体目录变更处理：保存设置后防抖重扫字体并刷新已打开的表格，
   * 使自定义字体无需重载插件即可出现在工具栏字体下拉中
   */
  private handleFontFolderChange(value: string) {
    this.plugin.settings.fontFolder = value.trim()
    void this.plugin.saveSettings()
    window.clearTimeout(this.fontFolderDebounce)
    this.fontFolderDebounce = window.setTimeout(() => {
      void this.plugin.loadFonts().then(() => {
        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_EXCEL_PRO).forEach((leaf) => {
          const view = leaf.view as ExcelProView
          view.refresh()
        })
      })
    }, 600)
  }

  // Obsidian 1.13.0+ 声明式设置定义：与 display() 保持同步，启用设置全局搜索。
  // control 定义自动读写 this.plugin.settings[key] 并调用 saveData()。
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: 'group',
        heading: t('BASE_COLOR'),
        items: [
          {
            name: t('BASE_COLOR'),
            desc: t('BASE_COLOR_DESC'),
            control: { type: 'dropdown', key: 'darkModal', options: { light: 'Light', dark: 'Dark' } },
          },
        ],
      },
      {
        type: 'group',
        heading: t('FILE_SETTING'),
        items: [
          {
            name: t('BIG_SHEET'),
            desc: fragWithHTML(t('BIG_SHEET_DESC')),
            control: { type: 'dropdown', key: 'isBigSheet', options: { true: 'True', false: 'False' } },
          },
          {
            name: t('FILE_LOCATION_MODE'),
            desc: t('FILE_LOCATION_MODE_DESC'),
            control: {
              type: 'dropdown',
              key: 'fileLocationMode',
              options: {
                'root': t('FILE_LOCATION_MODE_ROOT'),
                'current': t('FILE_LOCATION_MODE_CURRENT'),
                'current-sub': t('FILE_LOCATION_MODE_CURRENT_SUB'),
                'specified': t('FILE_LOCATION_MODE_SPECIFIED'),
              },
            },
          },
          {
            name: t('FILE_SUB_FOLDER'),
            desc: t('FILE_SUB_FOLDER_DESC'),
            visible: () => this.plugin.settings.fileLocationMode === 'current-sub',
            control: { type: 'text', key: 'fileSubFolder', placeholder: 'sheets' },
          },
          {
            name: t('FOLDER'),
            desc: t('FOLDER_DESC'),
            visible: () => this.plugin.settings.fileLocationMode === 'specified',
            control: { type: 'text', key: 'folder', placeholder: '/' },
          },
          {
            name: t('FILENAME_PREFIX'),
            desc: t('FILENAME_PREFIX_DESC'),
            control: { type: 'text', key: 'excelFilenamePrefix', placeholder: 'Excel' },
          },
          {
            name: t('FILENAME_DATE_TIME'),
            desc: t('FILENAME_DATE_TIME_DESC'),
            control: { type: 'text', key: 'excelFilenameDateTime', placeholder: 'YYYY-MM-DD HH.mm.ss' },
          },
        ],
      },
      {
        type: 'group',
        heading: t('EMBED_LINK_SETTING'),
        items: [
          {
            name: t('SHEET_HEIGHT_MODE'),
            desc: t('SHEET_HEIGHT_MODE_DESC'),
            control: {
              type: 'dropdown',
              key: 'sheetHeightMode',
              options: { auto: t('SHEET_HEIGHT_MODE_AUTO'), custom: t('SHEET_HEIGHT_MODE_CUSTOM') },
            },
          },
          {
            name: t('SHEET_HEIGHT'),
            desc: t('SHEET_HEIGHT_DESC'),
            visible: () => this.plugin.settings.sheetHeightMode === 'custom',
            control: { type: 'text', key: 'sheetHeight', placeholder: '300' },
          },
          {
            name: t('SHOW_SHEET_BUTTON'),
            desc: t('SHOW_SHEET_BUTTON_DESC'),
            control: { type: 'dropdown', key: 'showSheetButton', options: { true: 'True', false: 'False' } },
          },
          {
            name: t('SHOW_SHEET_FOOTER'),
            desc: t('SHOW_SHEET_FOOTER_DESC'),
            control: { type: 'dropdown', key: 'embedLinkShowFooter', options: { true: 'True', false: 'False' } },
          },
          {
            name: t('EMBED_LINK_OPEN_MODE'),
            desc: t('EMBED_LINK_OPEN_MODE_DESC'),
            control: {
              type: 'dropdown',
              key: 'embedLinkOpenMode',
              defaultValue: 'split-right',
              options: { 'split-right': t('OPEN_MODE_SPLIT_RIGHT'), 'current-tab': t('OPEN_MODE_CURRENT_TAB') },
            },
          },
        ],
      },
      {
        type: 'group',
        heading: t('UNIVER_SETTING'),
        items: [
          {
            name: t('NUMBER_FORMAT_LOCALE'),
            desc: t('NUMBER_FORMAT_LOCALE_DESC'),
            control: {
              type: 'dropdown',
              key: 'numberFormatLocal',
              options: {
                'zh-CN': '简体中文（中国）',
                'zh-TW': '繁體中文（台灣）',
                'cs': 'Čeština (Česko)',
                'da': 'Dansk (Danmark)',
                'nl': 'Nederlands (Nederland)',
                'en': 'English (United States)',
                'fi': 'Suomi (Suomi)',
                'fr': 'Français (France)',
                'de': 'Deutsch (Deutschland)',
                'el': 'Ελληνικά (Ελλάδα)',
                'hu': 'Magyar (Magyarország)',
                'is': 'Íslenska (Ísland)',
                'id': 'Bahasa Indonesia (Indonesia)',
                'it': 'Italiano (Italia)',
                'ja': '日本語（日本）',
                'ko': '한국어 (대한민국)',
                'nb': 'Norsk bokmål (Norge)',
                'pl': 'Polski (Polska)',
                'pt': 'Português (Portugal)',
                'ru': 'Русский (Россия)',
                'sk': 'Slovenčina (Slovensko)',
                'es': 'Español (España)',
                'sv': 'Svenska (Sverige)',
                'th': 'ไทย (ประเทศไทย)',
                'tr': 'Türkçe (Türkiye)',
                'vi': 'Tiếng Việt (Việt Nam)',
              },
            },
          },
          {
            name: t('MOBILE_RENDER_MODE'),
            desc: t('MOBILE_RENDER_MODE_DESC'),
            control: { type: 'dropdown', key: 'mobileRenderMode', options: { mobile: 'Mobile', desktop: 'Desktop' } },
          },
          {
            name: t('RTL_DIRECTION'),
            desc: t('RTL_DIRECTION_DESC'),
            control: { type: 'dropdown', key: 'rtlDirection', options: { ltr: 'LTR', rtl: 'RTL' } },
          },
          {
            name: t('FONT_FOLDER'),
            desc: t('FONT_FOLDER_DESC'),
            // 保留 display() 的 trim 行为，因此用 render 手动写回
            render: (setting) => {
              setting.addText(text =>
                text
                  .setPlaceholder('fonts')
                  .setValue(this.plugin.settings.fontFolder)
                  .onChange(value => this.handleFontFolderChange(value)),
              )
            },
          },
          {
            name: t('DEFAULT_FONT_FAMILY'),
            desc: t('DEFAULT_FONT_FAMILY_DESC'),
            control: { type: 'dropdown', key: 'defaultFontFamily', options: this.getDefaultFontOptions() },
          },
        ],
      },
      {
        type: 'group',
        // 授权码独立分组：与购买链接放在一起
        heading: t('AUTHORIZATION_CODE'),
        items: [
          {
            name: t('AUTHORIZATION_CODE'),
            desc: t('AUTHORIZATION_CODE_DESC'),
            // render 回调不自动保存，需手动写回并持久化
            render: (setting) => {
              setting
                .addTextArea(text =>
                  text
                    .setValue(this.plugin.settings.authorizationCode)
                    .onChange(async (value) => {
                      this.plugin.settings.authorizationCode = value
                      await this.plugin.saveSettings()
                    }),
                )
                .addButton((button) => {
                  button
                    .setButtonText(t('AUTHORIZATION_CODE_SUBMIT'))
                    .onClick(() => {
                      if (this.plugin.settings.authorizationCode && this.plugin.settings.authorizationCode.length > 0) {
                        update(this.plugin.settings.authorizationCode, (res) => {
                          if (res.code === 0)
                            new Notice(t('AUTHORIZATION_CODE_SUCCESS'))
                          else
                            new Notice(t('AUTHORIZATION_CODE_FAILED'))
                        })
                      }
                      else {
                        new Notice(t('AUTHORIZATION_CODE_FAILED'))
                      }
                    })
                })
            },
          },
          {
            // 购买链接（与原页脚内容一致）
            name: '',
            render: (setting) => {
              setting.settingEl.empty()
              setting.settingEl.createEl('hr')
              const linksEl = setting.settingEl.createDiv('authorization-code-container')
              linksEl.createEl('a', { href: 'https://docs.ljcoder.com/price/activate/en.html', text: t('AUTHORIZATION_CODE_GET') })
            },
          },
        ],
      },
    ]
  }

  display() {
    const { containerEl } = this

    containerEl.empty()

    new Setting(containerEl)
      .setName(t('BASE_COLOR'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('BASE_COLOR'))
      .setDesc(t('BASE_COLOR_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('light', 'Light')
          .addOption('dark', 'Dark')
          .setValue(this.plugin.settings.darkModal)
          .onChange(async (value) => {
            this.plugin.settings.darkModal = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('FILE_SETTING'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('BIG_SHEET'))
      .setDesc(fragWithHTML(t('BIG_SHEET_DESC')))
      .addDropdown(dropdown =>
        dropdown
          .addOption('true', 'True')
          .addOption('false', 'False')
          .setValue(this.plugin.settings.isBigSheet)
          .onChange(async (value) => {
            this.plugin.settings.isBigSheet = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('FILE_LOCATION_MODE'))
      .setDesc(t('FILE_LOCATION_MODE_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('root', t('FILE_LOCATION_MODE_ROOT'))
          .addOption('current', t('FILE_LOCATION_MODE_CURRENT'))
          .addOption('current-sub', t('FILE_LOCATION_MODE_CURRENT_SUB'))
          .addOption('specified', t('FILE_LOCATION_MODE_SPECIFIED'))
          .setValue(this.plugin.settings.fileLocationMode)
          .onChange(async (value) => {
            this.plugin.settings.fileLocationMode = value
            await this.plugin.saveSettings()
            // 刷新设置页以显示/隐藏子文件夹和指定文件夹输入框
            this.display()
          }),
      )

    if (this.plugin.settings.fileLocationMode === 'current-sub') {
      new Setting(containerEl)
        .setName(t('FILE_SUB_FOLDER'))
        .setDesc(t('FILE_SUB_FOLDER_DESC'))
        .addText(text =>
          text
            .setPlaceholder('sheets')
            .setValue(this.plugin.settings.fileSubFolder)
            .onChange(async (value) => {
              this.plugin.settings.fileSubFolder = value
              await this.plugin.saveSettings()
            }),
        )
    }

    if (this.plugin.settings.fileLocationMode === 'specified') {
      new Setting(containerEl)
        .setName(t('FOLDER'))
        .setDesc(t('FOLDER_DESC'))
        .addText(text =>
          text
            .setPlaceholder('/')
            .setValue(this.plugin.settings.folder)
            .onChange(async (value) => {
              this.plugin.settings.folder = value
              await this.plugin.saveSettings()
            }),
        )
    }

    new Setting(containerEl)
      .setName(t('FILENAME_PREFIX'))
      .setDesc(t('FILENAME_PREFIX_DESC'))
      .addText(text =>
        text
          .setPlaceholder('Excel')
          .setValue(this.plugin.settings.excelFilenamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.excelFilenamePrefix = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('FILENAME_DATE_TIME'))
      .setDesc(t('FILENAME_DATE_TIME_DESC'))
      .addText(text =>
        text
          .setPlaceholder('YYYY-MM-DD HH.mm.ss')
          .setValue(this.plugin.settings.excelFilenameDateTime)
          .onChange(async (value) => {
            this.plugin.settings.excelFilenameDateTime = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('EMBED_LINK_SETTING'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('SHEET_HEIGHT_MODE'))
      .setDesc(t('SHEET_HEIGHT_MODE_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('auto', t('SHEET_HEIGHT_MODE_AUTO'))
          .addOption('custom', t('SHEET_HEIGHT_MODE_CUSTOM'))
          .setValue(this.plugin.settings.sheetHeightMode)
          .onChange(async (value) => {
            this.plugin.settings.sheetHeightMode = value
            await this.plugin.saveSettings()
            // 刷新设置页以显示/隐藏自定义高度输入框
            this.display()
          }),
      )

    // 自定义模式时显示高度输入框
    if (this.plugin.settings.sheetHeightMode === 'custom') {
      new Setting(containerEl)
        .setName(t('SHEET_HEIGHT'))
        .setDesc(t('SHEET_HEIGHT_DESC'))
        .addText(text =>
          text
            .setPlaceholder('300')
            .setValue(this.plugin.settings.sheetHeight)
            .onChange(async (value) => {
              this.plugin.settings.sheetHeight = value
              await this.plugin.saveSettings()
            }),
        )
    }

    new Setting(containerEl)
      .setName(t('SHOW_SHEET_BUTTON'))
      .setDesc(t('SHOW_SHEET_BUTTON_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('true', 'True')
          .addOption('false', 'False')
          .setValue(this.plugin.settings.showSheetButton)
          .onChange(async (value) => {
            this.plugin.settings.showSheetButton = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('SHOW_SHEET_FOOTER'))
      .setDesc(t('SHOW_SHEET_FOOTER_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('true', 'True')
          .addOption('false', 'False')
          .setValue(this.plugin.settings.embedLinkShowFooter)
          .onChange(async (value) => {
            this.plugin.settings.embedLinkShowFooter = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('EMBED_LINK_OPEN_MODE'))
      .setDesc(t('EMBED_LINK_OPEN_MODE_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('split-right', t('OPEN_MODE_SPLIT_RIGHT'))
          .addOption('current-tab', t('OPEN_MODE_CURRENT_TAB'))
          .setValue(this.plugin.settings.embedLinkOpenMode || 'split-right')
          .onChange(async (value) => {
            this.plugin.settings.embedLinkOpenMode = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('UNIVER_SETTING'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('NUMBER_FORMAT_LOCALE'))
      .setDesc(t('NUMBER_FORMAT_LOCALE_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('zh-CN', '简体中文（中国）')
          .addOption('zh-TW', '繁體中文（台灣）')
          .addOption('cs', 'Čeština (Česko)')
          .addOption('da', 'Dansk (Danmark)')
          .addOption('nl', 'Nederlands (Nederland)')
          .addOption('en', 'English (United States)')
          .addOption('fi', 'Suomi (Suomi)')
          .addOption('fr', 'Français (France)')
          .addOption('de', 'Deutsch (Deutschland)')
          .addOption('el', 'Ελληνικά (Ελλάδα)')
          .addOption('hu', 'Magyar (Magyarország)')
          .addOption('is', 'Íslenska (Ísland)')
          .addOption('id', 'Bahasa Indonesia (Indonesia)')
          .addOption('it', 'Italiano (Italia)')
          .addOption('ja', '日本語（日本）')
          .addOption('ko', '한국어 (대한민국)')
          .addOption('nb', 'Norsk bokmål (Norge)')
          .addOption('pl', 'Polski (Polska)')
          .addOption('pt', 'Português (Portugal)')
          .addOption('ru', 'Русский (Россия)')
          .addOption('sk', 'Slovenčina (Slovensko)')
          .addOption('es', 'Español (España)')
          .addOption('sv', 'Svenska (Sverige)')
          .addOption('th', 'ไทย (ประเทศไทย)')
          .addOption('tr', 'Türkçe (Türkiye)')
          .addOption('vi', 'Tiếng Việt (Việt Nam)')

          .setValue(this.plugin.settings.numberFormatLocal)
          .onChange(async (value) => {
            this.plugin.settings.numberFormatLocal = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('MOBILE_RENDER_MODE'))
      .setDesc(t('MOBILE_RENDER_MODE_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('mobile', 'Mobile')
          .addOption('desktop', 'Desktop')
          .setValue(this.plugin.settings.mobileRenderMode)
          .onChange(async (value) => {
            this.plugin.settings.mobileRenderMode = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('RTL_DIRECTION'))
      .setDesc(t('RTL_DIRECTION_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('ltr', 'LTR')
          .addOption('rtl', 'RTL')
          .setValue(this.plugin.settings.rtlDirection)
          .onChange(async (value) => {
            this.plugin.settings.rtlDirection = value
            await this.plugin.saveSettings()
          }),
      )

    // 字体目录
    new Setting(containerEl)
      .setName(t('FONT_FOLDER'))
      .setDesc(t('FONT_FOLDER_DESC'))
      .addText(text =>
        text
          .setPlaceholder('fonts')
          .setValue(this.plugin.settings.fontFolder)
          .onChange(value => this.handleFontFolderChange(value)),
      )

    // 默认字体
    new Setting(containerEl)
      .setName(t('DEFAULT_FONT_FAMILY'))
      .setDesc(t('DEFAULT_FONT_FAMILY_DESC'))
      .addDropdown((dropdown) => {
        const options = this.getDefaultFontOptions()
        for (const [value, label] of Object.entries(options)) {
          dropdown.addOption(value, label)
        }
        dropdown
          .setValue(this.plugin.settings.defaultFontFamily)
          .onChange(async (value) => {
            this.plugin.settings.defaultFontFamily = value
            await this.plugin.saveSettings()
          })
      })

    // 授权码独立区块：与购买链接放在一起
    new Setting(containerEl)
      .setName(t('AUTHORIZATION_CODE'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('AUTHORIZATION_CODE'))
      .setDesc(t('AUTHORIZATION_CODE_DESC'))
      .addTextArea(text =>
        text
          .setValue(this.plugin.settings.authorizationCode)
          .onChange(async (value) => {
            this.plugin.settings.authorizationCode = value
            await this.plugin.saveSettings()
          }),
      )
      .addButton((button) => {
        button
          .setButtonText(t('AUTHORIZATION_CODE_SUBMIT'))
          .onClick(() => {
            if (this.plugin.settings.authorizationCode && this.plugin.settings.authorizationCode.length > 0) {
              update(this.plugin.settings.authorizationCode, (res) => {
                if (res.code === 0) {
                  new Notice(t('AUTHORIZATION_CODE_SUCCESS'))
                }
                else {
                  new Notice(t('AUTHORIZATION_CODE_FAILED'))
                }
              })
            }
            else {
              new Notice(t('AUTHORIZATION_CODE_FAILED'))
            }
          })
      })

    containerEl.createEl('hr')

    const linksEl = containerEl.createDiv('authorization-code-container')
    linksEl.createEl('a', { href: 'https://docs.ljcoder.com/price/activate/en.html', text: t('AUTHORIZATION_CODE_GET') })
  }
}
