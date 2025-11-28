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

  display() {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h1', { text: t('BASE_COLOR') })

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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('FOLDER'))
      .setDesc(t('FOLDER_DESC'))
      .addText(text =>
        text
          .setPlaceholder('/')
          .setValue(this.plugin.settings.folder)
          .onChange(async (value) => {
            this.plugin.settings.folder = value
            this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('FILENAME_PREFIX'))
      .setDesc(t('FILENAME_PREFIX_DESC'))
      .addText(text =>
        text
          .setPlaceholder('Excel')
          .setValue(this.plugin.settings.excelFilenamePrefix)
          .onChange(async (value) => {
            this.plugin.settings.excelFilenamePrefix = value
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
            this.plugin.saveSettings()
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
    linksEl.createEl('a', { href: 'https://docs.ljcoder.com/price/activate/en.html' }, (a) => {
      a.innerHTML = t('AUTHORIZATION_CODE_GET')
    })
  }
}
