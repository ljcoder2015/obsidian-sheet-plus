import { FUniver } from '@univerjs/core/facade'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ICustomRange, INumfmtLocaleTag, IWorkbookData } from '@univerjs/core'
import { CommandType, LifecycleStages } from '@univerjs/core'
import type { IAddOutgoingLinkCommandParams, ICancelOutgoingLinkCommandParams } from '@ljcoder/sheets-outgoing-link'
import { AddOutgoingLinkCommand, AddOutgoingLinkMutation, CancelOutgoingLinkCommand, OutgoingLinkCustomRangeType, SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { Spin } from 'antd'
import type { TFile } from 'obsidian'
import { debounce } from 'obsidian'
import type { FWorkbook } from '@univerjs/sheets/facade'
import { emitEvent, useEventBus } from '@ljcoder/smart-sheet'
import type { TabChangeProps, UnloadFileProps } from '@ljcoder/smart-sheet'
import type { IReplaceSnapshotCommandParams } from '@univerjs/docs-ui'
import { ReplaceSnapshotCommand } from '@univerjs/docs-ui'
import { createUniver } from '../univer/setup-univer'
import { useEditorContext } from '../../context/editorContext'
import { randomString } from '../../utils/uuid'
import { rangeToNumber } from '../../utils/data'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'
import { useUniver } from '../../context/UniverContext'
import { type DataService, outgoingLinksKey } from '../../services/data.service'

interface Props {
  file: TFile
  data: IWorkbookData
  dataService: DataService
  saveData: (data: any, key: string) => void
  onRender: (isToRange: boolean) => void
}

export function SheetTab({ file, data, dataService, onRender, saveData }: Props) {
  const { univerApi, setUniverApi } = useUniver()
  const { editor, app } = useEditorContext()
  const { plugin } = editor
  const containerRef = useRef<HTMLDivElement>(null)
  const [univerId, setUniverId] = useState<string>(randomString(6))
  const [loading, setLoading] = useState<boolean>(true)
  const tabChangeRef = useRef(false)
  let lastData = ''

  const save = (activeWorkbook: FWorkbook) => {
    const activeWorkbookData = activeWorkbook.save()
    const jsonData = JSON.stringify(activeWorkbookData)
    if (jsonData !== lastData) {
      if (lastData !== '') {
        saveData(activeWorkbookData, 'sheet')
      }
      lastData = jsonData
      if (!tabChangeRef.current) {
        emitEvent('sheetChange')
      }
      tabChangeRef.current = false
    }
  }

  const debounceSave = debounce((activeWorkbook: FWorkbook) => {
    log('[SheetTab]', 'debounce save sheet', tabChangeRef.current)
    save(activeWorkbook)
  }, 1000)

  useEffect(() => {
    log('[SheetTab]', 'sheetTab 挂载')

    const univerId = randomString(6)
    setUniverId(univerId)

    const options = {
      header: true,
      footer: true,
    }
    const darkMode = plugin.settings.darkModal === 'dark'
    const mobileRenderMode = plugin.settings.mobileRenderMode
    const univer = createUniver(options, containerRef.current, mobileRenderMode, darkMode)

    const univerAPI = FUniver.newAPI(univer)
    setUniverApi(univerAPI)

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      univer.dispose()
      setUniverApi(null)
      debounceSave.run()
      containerRef.current = null
    }
  }, [])

  const normalizeWikiLink = (link: string) => {
  // 去掉 [[ 和 ]]
    const inner = link.replace(/^\[\[|\]\]$/g, '')
    // 取最后一个路径片段
    const fileName = inner.split('/').pop() ?? inner
    // 去掉 .md
    const withoutExt = fileName.replace(/\.md$/i, '')
    return `[[${withoutExt}]]`
  }

  useMemo(() => {
    let lifeCycleDisposable = null
    let commandExecutedDisposable = null
    let beforeCommandDisposable = null
    if (univerApi && univerId) {
      log('[SheetTab]', 'createWorkbook', univerId)
      if (data) {
        univerApi.createWorkbook(data)
      }
      else {
        univerApi.createWorkbook({ id: randomString(6), name: file.path })
      }

      // set number format local
      const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
      univerApi.getActiveWorkbook().setNumfmtLocal(localeTag)

      lifeCycleDisposable = univerApi.addEvent(univerApi.Event.LifeCycleChanged, (res) => {
        if (res.stage === LifecycleStages.Ready && editor.subPath == null) {
          setTimeout(() => {
            onRender(false)
          }, 200)
        }
        if (res.stage === LifecycleStages.Rendered) {
          setLoading(false)
        }
      })

      beforeCommandDisposable = univerApi.addEvent(univerApi.Event.BeforeCommandExecute, (res) => {
        if (res.id == CancelOutgoingLinkCommand.id) {
          const params = res.params as ICancelOutgoingLinkCommandParams
          const { row, column, unitId, subUnitId } = params
          log('[SheetTab]', 'BeforeCommandExecute CancelOutgoingLinkCommand', params)
          const worksheet = univerApi.getWorkbook(unitId)?.getSheetBySheetId(subUnitId)?.getSheet()
          if (!worksheet) {
            return
          }

          const cellData = worksheet.getCell(row, column)
          if (!cellData) {
            return
          }

          const doc = worksheet.getCellDocumentModelWithFormula(cellData, row, column)
          if (!doc?.documentModel) {
            return
          }
          const snapshot = doc.documentModel!.getSnapshot()
          const customRanges = snapshot.body.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = dataService.getOutgoingLinks() || []
                outgoingLinks.remove(normalizedUrl)
                saveData(outgoingLinks, outgoingLinksKey)
              }
            }
          })

          log('[SheetTab]', 'BeforeCommandExecute CancelOutgoingLinkCommand snapshot', snapshot)
        }
        if (res.id == ReplaceSnapshotCommand.id) {
          const params = res.params as IReplaceSnapshotCommandParams
          log('[SheetTab]', 'BeforeCommandExecute ReplaceSnapshotCommand', params)
          const { snapshot } = params
          const customRanges = snapshot.body.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = dataService.getOutgoingLinks() || []
                outgoingLinks.remove(normalizedUrl)
                saveData(outgoingLinks, outgoingLinksKey)
              }
            }
          })
        }
      })

      commandExecutedDisposable = univerApi.addEvent(univerApi.Event.CommandExecuted, (res) => {
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

        if (res.id == AddOutgoingLinkCommand.id) {
          const params = res.params as IAddOutgoingLinkCommandParams
          const sourcePath = file.path
          const targetPath = params.link.payload.slice(2, -2)
          const targetFile = app?.vault.getAbstractFileByPath(targetPath)
          const path = app?.metadataCache.fileToLinktext(targetFile, sourcePath, true)
          log('[SheetTab]', 'AddOutgoingLinkCommand', res.params, path)
          if (path) {
            const link = `[[${path}]]`
            const outgoingLinks = dataService.getOutgoingLinks() || []
            outgoingLinks.push(link)
            saveData(outgoingLinks, 'outgoingLinks')
          }
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
        if (activeWorkbook) {
          debounceSave(activeWorkbook)
        }
      })
    }

    return () => {
      log('[SheetTab]', 'univerAPi卸载监听', lifeCycleDisposable, commandExecutedDisposable)
      lifeCycleDisposable?.dispose()
      commandExecutedDisposable?.dispose()
      beforeCommandDisposable?.dispose()
      beforeCommandDisposable = null
      lifeCycleDisposable = null
      commandExecutedDisposable = null
    }
  }, [univerApi])

  const tabChangeHandler = useCallback((props: TabChangeProps) => {
    tabChangeRef.current = true
    const { sheetId, rowIndex, colIndex, value } = props
    if (univerApi) {
      univerApi.getActiveWorkbook().getSheetBySheetId(sheetId).getRange(rowIndex, colIndex).setValue(value)
    }
  }, [univerId])

  useEventBus('tabChange', tabChangeHandler)

  useEventBus('unloadFile', (props: UnloadFileProps) => {
    if (props.filePath === file.path) {
      const activeWorkbook = univerApi?.getActiveWorkbook()
      if (activeWorkbook) {
        save(activeWorkbook)
      }
    }
  })

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
        <div ref={containerRef} className="my-univer" />
      </div>
    </Spin>
  )
}
