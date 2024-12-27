import type { App } from 'obsidian'
import { Notice, PluginSettingTab, Setting } from 'obsidian'
import { update } from '@ljcoder/authorization'
import { t } from './lang/helpers'
import type ExcelProPlugin from './main'

export class ExcelProSettingTab extends PluginSettingTab {
  plugin: ExcelProPlugin

  constructor(app: App, plugin: ExcelProPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display() {
    const { containerEl } = this

    containerEl.empty()

    new Setting(containerEl)
      .setName(t('FILE_SETTING'))
      .setHeading()

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
            update(this.plugin.settings.authorizationCode, (res) => {
              if (res.code === 0) {
                new Notice(t('AUTHORIZATION_CODE_SUCCESS'))
              }
              else {
                new Notice(t('AUTHORIZATION_CODE_FAILED'))
              }
            })
          })
      })
  }
}
