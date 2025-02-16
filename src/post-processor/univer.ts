import type { IWorkbookData } from '@univerjs/core'
import { UniverInstanceType } from '@univerjs/core'
import { FUniver } from '@univerjs/core/facade'
import { WorkbookEditablePermission } from '@univerjs/sheets'
import { randomString } from '../utils/uuid'
import { createUniver } from '../views/univer/setup-univer'

/**
 * 创建表格元素
 * @param data 数据JSON对象
 * @param height 渲染高度
 * @returns HTMLDivElement
 */
export function createUniverEl(data: IWorkbookData | null, height = 300, showFooter = false): HTMLDivElement {
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
    const univer = createUniver(options, id, true)

    if (data) {
      // workbookData 的内容都包含在 workbook 字段中
      const workbookData: IWorkbookData = data
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbookData)
    }
    else {
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, {})
    }

    const univerAPI = FUniver.newAPI(univer)
    const permission = univerAPI.getPermission()
    permission.setPermissionDialogVisible(false)
    const activeWorkbook = univerAPI.getActiveWorkbook()

    const unitId = activeWorkbook && activeWorkbook.getId()
    if (unitId) {
      permission.setWorkbookPermissionPoint(unitId, WorkbookEditablePermission, false)
    }
  }, 1000)

  return univerEl
}
