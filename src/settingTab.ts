import type { App } from 'obsidian'
import { Notice, PluginSettingTab, Setting } from 'obsidian'
import { update } from '@ljcoder/authorization'
import { t } from './lang/helpers'
import type ExcelProPlugin from './main'
import { fragWithHTML } from './utils/tools'

export class ExcelProSettingTab extends PluginSettingTab {
  plugin: ExcelProPlugin

  constructor(app: App, plugin: ExcelProPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  getSettingDefinitions() {
    return [
      {
        name: t('BASE_COLOR'),
        description: t('BASE_COLOR_DESC'),
        defaultValue: this.plugin.settings.darkModal,
        type: 'dropdown' as const,
        options: [
          { value: 'light', name: 'Light' },
          { value: 'dark', name: 'Dark' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.darkModal = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('BIG_SHEET'),
        description: t('BIG_SHEET_DESC'),
        defaultValue: this.plugin.settings.isBigSheet,
        type: 'dropdown' as const,
        options: [
          { value: 'true', name: 'True' },
          { value: 'false', name: 'False' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.isBigSheet = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('FILE_LOCATION_MODE'),
        description: t('FILE_LOCATION_MODE_DESC'),
        defaultValue: this.plugin.settings.fileLocationMode,
        type: 'dropdown' as const,
        options: [
          { value: 'root', name: t('FILE_LOCATION_MODE_ROOT') },
          { value: 'current', name: t('FILE_LOCATION_MODE_CURRENT') },
          { value: 'current-sub', name: t('FILE_LOCATION_MODE_CURRENT_SUB') },
          { value: 'specified', name: t('FILE_LOCATION_MODE_SPECIFIED') },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.fileLocationMode = value
          await this.plugin.saveSettings()
          this.display()
        },
      },
      {
        name: t('FILE_SUB_FOLDER'),
        description: t('FILE_SUB_FOLDER_DESC'),
        defaultValue: this.plugin.settings.fileSubFolder,
        type: 'text' as const,
        placeholder: 'sheets',
        onChange: async (value: string) => {
          this.plugin.settings.fileSubFolder = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('FOLDER'),
        description: t('FOLDER_DESC'),
        defaultValue: this.plugin.settings.folder,
        type: 'text' as const,
        placeholder: '/',
        onChange: async (value: string) => {
          this.plugin.settings.folder = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('FILENAME_PREFIX'),
        description: t('FILENAME_PREFIX_DESC'),
        defaultValue: this.plugin.settings.excelFilenamePrefix,
        type: 'text' as const,
        placeholder: 'Excel',
        onChange: async (value: string) => {
          this.plugin.settings.excelFilenamePrefix = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('FILENAME_DATE_TIME'),
        description: t('FILENAME_DATE_TIME_DESC'),
        defaultValue: this.plugin.settings.excelFilenameDateTime,
        type: 'text' as const,
        placeholder: 'YYYY-MM-DD HH.mm.ss',
        onChange: async (value: string) => {
          this.plugin.settings.excelFilenameDateTime = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('SHEET_HEIGHT'),
        description: t('SHEET_HEIGHT_DESC'),
        defaultValue: this.plugin.settings.sheetHeight,
        type: 'text' as const,
        placeholder: '300',
        onChange: async (value: string) => {
          this.plugin.settings.sheetHeight = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('SHOW_SHEET_BUTTON'),
        description: t('SHOW_SHEET_BUTTON_DESC'),
        defaultValue: this.plugin.settings.showSheetButton,
        type: 'dropdown' as const,
        options: [
          { value: 'true', name: 'True' },
          { value: 'false', name: 'False' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.showSheetButton = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('SHOW_SHEET_FOOTER'),
        description: t('SHOW_SHEET_FOOTER_DESC'),
        defaultValue: this.plugin.settings.embedLinkShowFooter,
        type: 'dropdown' as const,
        options: [
          { value: 'true', name: 'True' },
          { value: 'false', name: 'False' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.embedLinkShowFooter = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('EMBED_LINK_OPEN_MODE'),
        description: t('EMBED_LINK_OPEN_MODE_DESC'),
        defaultValue: this.plugin.settings.embedLinkOpenMode || 'split-right',
        type: 'dropdown' as const,
        options: [
          { value: 'split-right', name: t('OPEN_MODE_SPLIT_RIGHT') },
          { value: 'current-tab', name: t('OPEN_MODE_CURRENT_TAB') },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.embedLinkOpenMode = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('NUMBER_FORMAT_LOCALE'),
        description: t('NUMBER_FORMAT_LOCALE_DESC'),
        defaultValue: this.plugin.settings.numberFormatLocal,
        type: 'dropdown' as const,
        options: [
          { value: 'zh-CN', name: '简体中文（中国）' },
          { value: 'zh-TW', name: '繁體中文（台灣）' },
          { value: 'cs', name: 'Čeština (Česko)' },
          { value: 'da', name: 'Dansk (Danmark)' },
          { value: 'nl', name: 'Nederlands (Nederland)' },
          { value: 'en', name: 'English (United States)' },
          { value: 'fi', name: 'Suomi (Suomi)' },
          { value: 'fr', name: 'Français (France)' },
          { value: 'de', name: 'Deutsch (Deutschland)' },
          { value: 'el', name: 'Ελληνικά (Ελλάδα)' },
          { value: 'hu', name: 'Magyar (Magyarország)' },
          { value: 'is', name: 'Íslenska (Ísland)' },
          { value: 'id', name: 'Bahasa Indonesia (Indonesia)' },
          { value: 'it', name: 'Italiano (Italia)' },
          { value: 'ja', name: '日本語（日本）' },
          { value: 'ko', name: '한국어 (대한민국)' },
          { value: 'nb', name: 'Norsk bokmål (Norge)' },
          { value: 'pl', name: 'Polski (Polska)' },
          { value: 'pt', name: 'Português (Portugal)' },
          { value: 'ru', name: 'Русский (Россия)' },
          { value: 'sk', name: 'Slovenčina (Slovensko)' },
          { value: 'es', name: 'Español (España)' },
          { value: 'sv', name: 'Svenska (Sverige)' },
          { value: 'th', name: 'ไทย (ประเทศไทย)' },
          { value: 'tr', name: 'Türkçe (Türkiye)' },
          { value: 'vi', name: 'Tiếng Việt (Việt Nam)' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.numberFormatLocal = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('MOBILE_RENDER_MODE'),
        description: t('MOBILE_RENDER_MODE_DESC'),
        defaultValue: this.plugin.settings.mobileRenderMode,
        type: 'dropdown' as const,
        options: [
          { value: 'mobile', name: 'Mobile' },
          { value: 'desktop', name: 'Desktop' },
        ],
        onChange: async (value: string) => {
          this.plugin.settings.mobileRenderMode = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('AUTHORIZATION_CODE'),
        description: t('AUTHORIZATION_CODE_DESC'),
        defaultValue: this.plugin.settings.authorizationCode,
        type: 'textarea' as const,
        onChange: async (value: string) => {
          this.plugin.settings.authorizationCode = value
          await this.plugin.saveSettings()
        },
      },
      {
        name: t('FONT_FOLDER'),
        description: t('FONT_FOLDER_DESC'),
        defaultValue: this.plugin.settings.fontFolder,
        type: 'text' as const,
        placeholder: 'fonts',
        onChange: async (value: string) => {
          this.plugin.settings.fontFolder = value.trim()
          await this.plugin.saveSettings()
        },
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

    // 字体目录
    new Setting(containerEl)
      .setName(t('FONT_FOLDER'))
      .setDesc(t('FONT_FOLDER_DESC'))
      .addText(text =>
        text
          .setPlaceholder('fonts')
          .setValue(this.plugin.settings.fontFolder)
          .onChange(async (value) => {
            this.plugin.settings.fontFolder = value.trim()
            await this.plugin.saveSettings()
          }),
      )

    containerEl.createEl('hr')

    const linksEl = containerEl.createDiv('authorization-code-container')
    linksEl.createEl('a', { href: 'https://docs.ljcoder.com/price/activate/en.html', text: t('AUTHORIZATION_CODE_GET') })
  }
}
