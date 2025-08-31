import { FUniver } from '@univerjs/core/facade'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { INumfmtLocaleTag, IWorkbookData } from '@univerjs/core'
import { CommandType, LifecycleStages, throttle } from '@univerjs/core'
import { SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { Spin } from 'antd'
import { createUniver } from '../univer/setup-univer'
import { useEditorContext } from '../../context/editorContext'
import { randomString } from '../../utils/uuid'
import { rangeToNumber } from '../../utils/data'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'
import { useUniver } from '../../context/UniverContext'

interface Props {
  id: string
  data: IWorkbookData
  saveData: (data: any, key: string) => void
  onRender: (isToRange: boolean) => void
}

export function SheetTab({ id, data, onRender, saveData }: Props) {
  const { univerApi, setUniverApi } = useUniver()
  const { editor, app } = useEditorContext()
  const { plugin } = editor
  const containerRef = useRef<HTMLDivElement>(null)
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
    const univerAPI = FUniver.newAPI(univer)
    setUniverApi(univerAPI)

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      univerAPI?.dispose()
      setUniverApi(null)
    }
  }, [])

  const throttledSave = throttle((data, key) => {
    saveData(data, key)
  }, 1000)

  useEffect(() => {
    if (univerApi) {
      log('[SheetTab]', 'createWorkbook')
      univerApi.createWorkbook(data)

      // set number format local
      const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
      univerApi.getActiveWorkbook().setNumfmtLocal(localeTag)

      // loading
      univerApi.addEvent(univerApi.Event.LifeCycleChanged, (res) => {
        // console.log('LifeCycleChanged', res.stage)
        if (res.stage === LifecycleStages.Ready && editor.subPath == null) {
          setTimeout(() => {
            onRender(false)
          }, 200)
        }
        if (res.stage === LifecycleStages.Rendered) {
          setLoading(false)
        }
      })

      univerApi.addEvent(univerApi.Event.CommandExecuted, (res) => {
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
          univerApi?.executeCommand(SearchResultOutgoingLinkCommand.id, { links })
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

        const activeWorkbook = univerApi.getActiveWorkbook()
        if (!activeWorkbook) {
          return
        }
        const activeWorkbookData = activeWorkbook.save()

        throttledSave(activeWorkbookData, id)
      })
    }
  }, [univerApi])

  // 滚动到指定区域
  const scrollToRange = useCallback(() => {
    if (editor.subPath && univerApi) {
      const array = editor.subPath.split('|')
      const sheetName = array[0]
      const rangeString = array[1]
      const rangeNumber = rangeToNumber(rangeString)
      // 打开文件后的子路径，用来选中表格范围
      const activeWorkbook = univerApi.getActiveWorkbook()
      const sheet = activeWorkbook.getSheetByName(sheetName)
      activeWorkbook.setActiveSheet(sheet)
      // getRange(row: number, column: number, numRows: number, numColumns: number): FRange;
      const selection = sheet.getRange(rangeNumber.startRow, rangeNumber.startCol, rangeNumber.endRow - rangeNumber.startRow + 1, rangeNumber.endCol - rangeNumber.startCol + 1)
      sheet.setActiveSelection(selection)

      const GAP = 1
      univerApi.executeCommand(ScrollToRangeOperation.id, {
        range: {
          startRow: Math.max(selection.getRow() - GAP, 0),
          endRow: selection.getRow() + selection.getHeight() + GAP,
          startColumn: selection.getColumn(),
          endColumn: selection.getColumn() + selection.getWidth() + GAP,
        },
      })
    }
  }, [editor.subPath, univerApi])

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
