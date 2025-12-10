import type { INumfmtLocaleTag, IWorkbookData } from '@univerjs/core'
import { WorkbookEditablePermission } from '@univerjs/sheets'
import { randomString } from '../utils/uuid'
import { createUniver } from '../views/univer/setup-univer'
import type ExcelProPlugin from '../main'

/**
 * 创建表格元素
 * @param data 数据JSON对象
 * @param height 渲染高度
 * @returns HTMLDivElement
 */
export function createUniverEl(data: IWorkbookData | null, height = 300, showFooter = false, plugin: ExcelProPlugin): HTMLDivElement {
  // console.log('createUniverEl', data)
  const id = `univer-embed-${randomString(6)}`
  const univerEl = createDiv({
    cls: 'sheet-iframe',
    attr: {
      id,
      style: `height: ${height}px`,
    },
  })

  setTimeout(() => {
    const options = {
      header: false,
      contextMenu: false,
      footer: showFooter,
    }
    const darkMode = plugin.settings.darkModal === 'dark'
    const univerAPI = createUniver(plugin.availableFonts, options, id, plugin.settings.mobileRenderMode, darkMode, true)

    if (data) {
      // workbookData 的内容都包含在 workbook 字段中
      const workbookData: IWorkbookData = data
      univerAPI.createWorkbook(workbookData)
    }
    else {
      univerAPI.createWorkbook({})
    }

    const activeWorkbook = univerAPI.getActiveWorkbook()

    const unitId = activeWorkbook && activeWorkbook.getId()
    if (unitId) {
      const permission = activeWorkbook.getPermission()
      permission.setPermissionDialogVisible(false)
      permission.setWorkbookPermissionPoint(unitId, WorkbookEditablePermission, false)
    }

    const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
    activeWorkbook?.setNumfmtLocal(localeTag)
  }, 1000)

  return univerEl
}
