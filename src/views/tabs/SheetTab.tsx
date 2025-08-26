import { FUniver } from '@univerjs/core/facade'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { INumfmtLocaleTag, IWorkbookData, Univer } from '@univerjs/core'
import { CommandType, LifecycleStages, throttle } from '@univerjs/core'
import { SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { Spin } from 'antd'
import { createUniver } from '../univer/setup-univer'
import { usePluginContext } from '../../context/pluginContext'
import { useApp } from '../../context/appContext'
import type { ExcelProView } from '../excelProView'
import { randomString } from '../../utils/uuid'
import { rangeToNumber } from '../../utils/data'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'

interface Props {
  id: string
  data: IWorkbookData
  saveData: (data: any, key: string) => void
  onRender: (isToRange: boolean) => void
}

export function SheetTab({ id, data, saveData, onRender }: Props) {
  const viewContext: ExcelProView = usePluginContext()
  const { plugin } = viewContext
  const app = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const [univer, setUniver] = useState<Univer>()
  const [univerAPI, setUniverAPI] = useState<FUniver>()
  const [univerId, setUniverId] = useState<string>(randomString(6))
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    log('[SheetTab]', 'sheetTab 挂载')
    const options = {
      header: true,
      footer: true,
    }

    const darkMode = plugin.settings.darkModal === 'dark'
    const mobileRenderMode = plugin.settings.mobileRenderMode

    const univerId = randomString(6)
    setUniverId(univerId)
    const univer = createUniver(options, containerRef.current, mobileRenderMode, darkMode)
    setUniver(univer)
    setUniverAPI(FUniver.newAPI(univer))

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      univerAPI?.dispose()
    }
  }, [])

  const throttledSave = throttle((data, key) => {
    saveData(data, key)
  }, 1000)

  useEffect(() => {
    if (univerAPI) {
      viewContext.univerAPI = univerAPI
      univerAPI.createWorkbook(data)

      // set number format local
      const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
      univerAPI.getActiveWorkbook().setNumfmtLocal(localeTag)

      // loading
      univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, (res) => {
        // console.log('LifeCycleChanged', res.stage)
        if (res.stage === LifecycleStages.Ready && viewContext.subPath == null) {
          onRender(false)
        }
        if (res.stage === LifecycleStages.Rendered) {
          setLoading(false)
        }
      })

      univerAPI.addEvent(univerAPI.Event.CommandExecuted, (res) => {
        if (res.id === SearchOutgoingLinkCommand.id) {
          const links = app?.vault.getFiles().map((file) => {
            return {
              basename: file.basename,
              extension: file.extension,
              name: file.name,
              path: file.path,
              type: SheetOutgoingLinkType.FILE,
            }
          })
          univerAPI?.executeCommand(SearchResultOutgoingLinkCommand.id, { links })
        }

        if (res.id === NavigationOutgoingLinkOperation.id) {
          const params = res.params as INavigationOutgoingLinkOperationParams
          if (params.url.startsWith('[[')) {
            app?.workspace.openLinkText(params.url.slice(2, -2), '', 'split')
          }
        }

        if (res.type !== CommandType.MUTATION) {
          return
        }

        const activeWorkbook = univerAPI.getActiveWorkbook()
        if (!activeWorkbook) {
          return
        }
        const activeWorkbookData = activeWorkbook.save()

        throttledSave(activeWorkbookData, id)
      })
    }
  }, [univerAPI])

  // 滚动到指定区域
  const scrollToRange = useCallback(() => {
    if (viewContext.subPath && univerAPI) {
      const array = viewContext.subPath.split('|')
      const sheetName = array[0]
      const rangeString = array[1]
      const rangeNumber = rangeToNumber(rangeString)
      // 打开文件后的子路径，用来选中表格范围
      const activeWorkbook = univerAPI.getActiveWorkbook()
      const sheet = activeWorkbook.getSheetByName(sheetName)
      activeWorkbook.setActiveSheet(sheet)
      // getRange(row: number, column: number, numRows: number, numColumns: number): FRange;
      const selection = sheet.getRange(rangeNumber.startRow, rangeNumber.startCol, rangeNumber.endRow - rangeNumber.startRow + 1, rangeNumber.endCol - rangeNumber.startCol + 1)
      sheet.setActiveSelection(selection)

      const GAP = 1
      univerAPI.executeCommand(ScrollToRangeOperation.id, {
        range: {
          startRow: Math.max(selection.getRow() - GAP, 0),
          endRow: selection.getRow() + selection.getHeight() + GAP,
          startColumn: selection.getColumn(),
          endColumn: selection.getColumn() + selection.getWidth() + GAP,
        },
      })
    }
  }, [viewContext.subPath, univerAPI])

  useEffect(() => {
    scrollToRange()
    onRender(true)
  }, [scrollToRange])

  return (
    <Spin spinning={loading} size="large" tip={t('LOADING')}>
      <div id="sheet-box">
        <div ref={containerRef} id={univerId} className="my-univer" />
      </div>
    </Spin>
  )
}
