import type { INumfmtLocaleTag, IWorkbookData } from '@univerjs/core'
import { log, warn } from '@ljcoder/smart-sheet/src/utils/log'
import type { FUniver } from '@univerjs/core/facade'
import { randomString } from '../utils/uuid'
import { createUniver } from '../views/univer/setup-univer'
import type ExcelProPlugin from '../main'

/**
 * 创建表格元素
 * @param data 数据JSON对象
 * @param height 渲染高度
 * @returns HTMLDivElement
 */
export function createUniverEl(
  data: IWorkbookData | null,
  height = 300,
  showFooter = false,
  plugin: ExcelProPlugin,
): HTMLDivElement {
  const id = `univer-embed-${randomString(6)}`
  const univerEl = createDiv({
    cls: 'lj-sheet-iframe',
    attr: {
      id,
      style: `height: ${height}px; width: 100%;`,
    },
  })

  // 等待元素真正挂载到 DOM 后再初始化
  const observer = new MutationObserver(async () => {
    if (document.getElementById(id)) {
      log('[createUniverEl]', 'Univer container mounted')
      observer.disconnect()
      await initUniver(univerEl, id, data, plugin, showFooter)
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  return univerEl
}

async function initUniver(el: HTMLDivElement, id: string, data: IWorkbookData | null, plugin: ExcelProPlugin, showFooter: boolean): Promise<FUniver> {
  log('[createUniverEl]', `Univer container initialized: ${id}`, data)
  // 确认容器尺寸正常再初始化
  if (el.offsetWidth === 0 || el.offsetHeight === 0) {
    warn('[createUniverEl]', 'Univer container has zero size, check CSS')
  }

  const options = {
    header: false,
    contextMenu: false,
    footer: showFooter,
  }
  const darkMode = plugin.settings.darkModal === 'dark'
  const { univerAPI } = createUniver(plugin.availableFonts, options, id, plugin.settings.mobileRenderMode, darkMode, true)

  if (data) {
    // workbookData 的内容都包含在 workbook 字段中
    const workbookData: IWorkbookData = data
    univerAPI.createWorkbook(workbookData)
  }
  else {
    univerAPI.createWorkbook({})
  }

  const activeWorkbook = univerAPI.getActiveWorkbook()

  if (activeWorkbook) {
    const permission = activeWorkbook.getWorkbookPermission()
    await permission.setReadOnly()
    univerAPI.setPermissionDialogVisible(false)
    log('[createUniverEl]', 'Univer permission edit false')
  }

  const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
  activeWorkbook?.setNumfmtLocal(localeTag)

  return univerAPI
}
