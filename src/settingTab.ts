import type { App, SettingDefinitionItem } from 'obsidian'
import { Notice, PluginSettingTab } from 'obsidian'
import { getLicenseDevices, removeLicenseDevice, update, type LicenseDeviceInfo } from '@ljcoder/authorization'
import { ConfigService } from '@univerjs/core'
import { FontService, UI_PLUGIN_CONFIG_KEY } from '@univerjs/ui'
import { t } from './lang/helpers'
import type ExcelProPlugin from './main'
import { VIEW_TYPE_EXCEL_PRO } from './common/constants'
import type { ExcelProView } from './views/ExcelProView'
import { buildFontConfigs } from './services/fontManager'
import { fragWithHTML } from './utils/tools'

/** 同一台机器可能因重装或换 vault 留下多条 deviceId，展示时合并为一组 */
interface DeviceGroup {
  devices: LicenseDeviceInfo[]
}

/**
 * 按“名称+型号”合并设备：服务端已按最后活跃时间倒序返回，组内第一条即最近使用记录。
 * 拿不到名称的老数据无法判断是否同一台机器，保持按 deviceId 各自成组。
 */
function groupDevices(devices: LicenseDeviceInfo[]): DeviceGroup[] {
  const groups = new Map<string, DeviceGroup>()

  for (const device of devices) {
    const name = device.deviceName?.trim()
    const key = name ? `${name}|${device.deviceModel?.trim() ?? ''}` : device.deviceId
    const group = groups.get(key)

    if (group) {
      group.devices.push(device)
    }
    else {
      groups.set(key, { devices: [device] })
    }
  }

  return [...groups.values()]
}

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
        // 自定义字体列表已变化，重算设置定义以刷新「默认字体」下拉的可选字体
        this.update()
        this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_EXCEL_PRO).forEach((leaf) => {
          const view = leaf.view as ExcelProView
          view.refresh()
        })
      })
    }, 600)
  }

  /** 渲染已激活设备列表，每次打开设置页或点击刷新都重新拉取 */
  private async renderDeviceManager(container: HTMLElement): Promise<void> {
    const code = this.plugin.settings.authorizationCode?.trim()

    container.empty()

    const header = container.createDiv('smart-sheet-device-header')
    header.createDiv({ cls: 'setting-item-name', text: t('AUTHORIZATION_DEVICE_TITLE') })
    const refreshButton = header.createEl('button', { text: t('AUTHORIZATION_DEVICE_REFRESH') })
    refreshButton.onclick = () => { void this.renderDeviceManager(container) }

    container.createDiv({ cls: 'smart-sheet-device-hint', text: t('AUTHORIZATION_DEVICE_DESC') })

    if (!code) {
      container.createDiv({ cls: 'smart-sheet-device-hint', text: t('AUTHORIZATION_DEVICE_EMPTY') })
      return
    }

    const listEl = container.createDiv({ cls: 'smart-sheet-device-hint', text: t('LOADING') })
    const result = await getLicenseDevices(code)

    listEl.remove()

    if (!result.ok) {
      container.createDiv({ cls: 'smart-sheet-device-hint', text: t('AUTHORIZATION_DEVICE_LOAD_FAILED') })
      return
    }

    if (result.devices.length === 0) {
      container.createDiv({ cls: 'smart-sheet-device-hint', text: t('AUTHORIZATION_DEVICE_EMPTY') })
      return
    }

    const listContainer = container.createDiv()
    for (const group of groupDevices(result.devices)) {
      this.renderDeviceRow(listContainer, container, code, group)
    }
  }

  private renderDeviceRow(
    parent: HTMLElement,
    container: HTMLElement,
    code: string,
    group: DeviceGroup,
  ): void {
    const primary = group.devices[0]
    const name = primary.deviceName?.trim()
    const model = primary.deviceModel?.trim()
    const isCurrent = group.devices.some(device => device.current)

    const row = parent.createDiv('smart-sheet-device-row')
    const meta = row.createDiv('smart-sheet-device-meta')
    // 有名称显示名称，其次型号，都没有时退回截断的设备 ID
    const idLine = meta.createDiv({ cls: 'smart-sheet-device-id', text: name || model || this.formatDeviceId(primary.deviceId) })

    if (isCurrent) {
      idLine.appendText(` (${t('AUTHORIZATION_DEVICE_CURRENT')})`)
    }

    // 名称与型号同时存在时补一行型号，避免只看名称分不清设备类型
    if (name && model) {
      meta.createDiv({ text: model })
    }

    meta.createDiv({
      text: `${t('AUTHORIZATION_DEVICE_LAST_SEEN')}: ${new Date(primary.lastSeenAt * 1000).toLocaleString()}`,
    })

    const removeButton = row.createEl('button', { text: t('AUTHORIZATION_DEVICE_REMOVE') })

    // 当前设备不允许移除；合并组里其余旧记录仍可清理，用于释放名额
    const removable = group.devices.filter(device => !device.current)

    if (removable.length === 0) {
      removeButton.disabled = true
      return
    }

    removeButton.onclick = async () => {
      if (!window.confirm(t('AUTHORIZATION_DEVICE_REMOVE_CONFIRM'))) {
        return
      }

      removeButton.disabled = true

      let failed = false
      for (const device of removable) {
        const removed = await removeLicenseDevice(code, device.deviceId)

        if (!removed.ok) {
          failed = true
          break
        }
      }

      new Notice(t(failed ? 'AUTHORIZATION_DEVICE_REMOVE_FAILED' : 'AUTHORIZATION_DEVICE_REMOVE_SUCCESS'))
      void this.renderDeviceManager(container)
    }
  }

  /** 设备 ID 较长，只展示首尾用于区分 */
  private formatDeviceId(deviceId: string): string {
    return deviceId.length <= 12 ? deviceId : `${deviceId.slice(0, 8)}…${deviceId.slice(-4)}`
  }

  // Obsidian 1.13.0+ 声明式设置定义：这是本设置页的**唯一**渲染来源，同时启用设置全局搜索。
  // control 定义自动读写 this.plugin.settings[key] 并调用 saveData()。
  // 不要再写 display() 覆盖：minAppVersion 已是 1.13.0，声明式定义存在时 Obsidian 会完全
  // 绕过 display()，它只会变成永不被调用的死代码（官方审查规则 no-deprecated-display）。
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
            // 字体目录要在写回前 trim，control 定义做不到，所以用 render 手动处理
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
                          if (res.code === 0) {
                            // 旧码可能被服务端换发为 v2 码，需同步写回设置
                            void this.plugin.adoptIssuedLicenseCode(res.data)
                            new Notice(t('AUTHORIZATION_CODE_SUCCESS'))
                          }
                          else if (res.code === 40300) {
                            // 设备名额已满（每个激活码最多 6 台）
                            new Notice(t('AUTHORIZATION_CODE_DEVICE_LIMIT'))
                          }
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
            // 已激活设备管理：持有激活码即可查看并清理旧设备，不依赖本地授权状态
            name: '',
            render: (setting) => {
              setting.settingEl.empty()
              const container = setting.settingEl.createDiv('smart-sheet-device-manager')
              void this.renderDeviceManager(container)
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
}
