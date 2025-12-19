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

    // AI助手配置
    new Setting(containerEl)
      .setName(t('AI_ASSISTANT_SETTINGS'))
      .setHeading()

    new Setting(containerEl)
      .setName(t('AI_PLATFORM'))
      .setDesc(t('AI_PLATFORM_DESC'))
      .addDropdown(dropdown =>
        dropdown
          .addOption('openai', t('AI_OPENAI'))
          .addOption('qwenChina', t('AI_QWEN_CHINA'))
          .addOption('qwen', t('AI_QWEN'))
          .setValue(this.plugin.settings.aiModePlatform)
          .onChange(async (value) => {
            this.plugin.settings.aiModePlatform = value
            // 根据模型选择自动设置默认基础URL
            if (value === 'openai') {
              this.plugin.settings.aiBaseUrl = 'https://api.openai.com/v1/responses'
              this.plugin.settings.aiModel = 'gpt-3.5-turbo'
            }
            else if (value === 'qwenChina') {
              this.plugin.settings.aiBaseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
              this.plugin.settings.aiModel = 'qwen-plus'
            }
            else {
              this.plugin.settings.aiBaseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
              this.plugin.settings.aiModel = 'qwen-plus'
            }
            this.plugin.saveSettings()
            // 重新渲染设置界面，更新基础URL输入框的值
            this.display()
          }),
      )

    new Setting(containerEl)
      .setName(t('AI_MODEL'))
      .setDesc(t('AI_MODEL_DESC'))
      .addDropdown(dropdown => {
        if (this.plugin.settings.aiModePlatform === 'openai') {
          dropdown
            .addOption('gpt-5', t('AI_GPT_5'))
            .addOption('gpt-5-mini', t('AI_GPT_5_MINI'))
            .addOption('gpt-5-nano', t('AI_GPT_5_NANO'))
            .onChange(async (value) => {
              this.plugin.settings.aiModel = value
              this.plugin.saveSettings()
            })
        }
        else {
          dropdown
            .addOption('qwen3-max', t('AI_QWEN3_MAX'))
            .addOption('qwen-plus', t('AI_QWEN_PLUS'))
            .addOption('qwen-flash', t('AI_QWEN_FLASH'))
            .onChange(async (value) => {
              this.plugin.settings.aiModel = value
              this.plugin.saveSettings()
            })
        }
      })

    new Setting(containerEl)
      .setName(t('AI_API_KEY'))
      .setDesc(t('AI_API_KEY_DESC'))
      .addText(text =>
        text
          .setPlaceholder('sk-xxx')
          .setValue(this.plugin.settings.aiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.aiApiKey = value
            this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName(t('AI_BASE_URL'))
      .setDesc(t('AI_BASE_URL_DESC'))
      .addText(text =>
        text
          .setValue(this.plugin.settings.aiBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.aiBaseUrl = value
            this.plugin.saveSettings()
          }),
      )

    containerEl.createEl('hr')

    const linksEl = containerEl.createDiv('authorization-code-container')
    linksEl.createEl('a', { href: 'https://docs.ljcoder.com/price/activate/en.html' }, (a) => {
      a.innerHTML = t('AUTHORIZATION_CODE_GET')
    })
  }
}
