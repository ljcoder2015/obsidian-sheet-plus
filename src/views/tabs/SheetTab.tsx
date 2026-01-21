import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { INumfmtLocaleTag, Univer } from '@univerjs/core'
import { CommandType, LifecycleStages } from '@univerjs/core'
import type { IAddOutgoingLinkCommandParams, ICancelOutgoingLinkCommandParams } from '@ljcoder/sheets-outgoing-link'
import { AddOutgoingLinkCommand, AddOutgoingLinkMutation, CancelOutgoingLinkCommand, OutgoingLinkCustomRangeType, SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { Spin } from 'antd'
import type { IReplaceSnapshotCommandParams } from '@univerjs/docs-ui'
import { ReplaceSnapshotCommand } from '@univerjs/docs-ui'
import { ImportFinishCommand, ImportStartCommand } from '@ljcoder/import-export'
import { Platform } from 'obsidian'
import { createUniver } from '../univer/setup-univer'
import { useEditorContext } from '../../context/editorContext'
import { randomString } from '../../utils/uuid'
import { deepClone, rangeToNumber } from '../../utils/data'
import { Tools } from '../../utils/tools'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'
import { useUniver } from '../../context/UniverContext'
import { useSheetStore } from '../../context/SheetStoreProvider'
import { OUTGOING_LINKS_UPDATE_ACTION, SHEET_UPDATE_ACTION } from '../../services/reduce'
import type { FontInfo } from '../../services/fontManager'

export function SheetTab({ switchTab }: { switchTab: () => void }) {
  const { state, dispatch } = useSheetStore()
  const { univerApi, setUniverApi } = useUniver()
  const { editor, app } = useEditorContext()
  const { plugin } = editor
  const containerRef = useRef<HTMLDivElement>(null)
  const [univer, setUniver] = useState<Univer>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [spinTip, setSpinTip] = useState<string>(t('LOADING'))

  useEffect(() => {
    log('[SheetTab]', 'sheetTab 挂载')

    const options = {
      header: true,
      footer: true,
    }
    const darkMode = plugin.settings.darkModal === 'dark'
    const mobileRenderMode = plugin.settings.mobileRenderMode
    const { univerAPI, univer } = createUniver(plugin.availableFonts, options, containerRef.current, mobileRenderMode, darkMode)
    setUniverApi(univerAPI)
    setUniver(univer)

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      if (univer) {
        log('[SheetTab]', 'disposeUniver', univer)
        univer.dispose()
      }
      univerAPI.dispose()
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

  useEffect(() => {
    let lifeCycleDisposable: { dispose: () => void } | null = null
    let commandExecutedDisposable: { dispose: () => void } | null = null
    let beforeCommandDisposable: { dispose: () => void } | null = null
    if (univerApi) {
      const locale = Tools.convertNumberFormatLocalToLocaleType(plugin.settings.numberFormatLocal)
      if (state.sheet) {
        const newSheet = deepClone(state.sheet)
        newSheet.locale = locale
        univerApi.createWorkbook(newSheet)
      }
      else {
        univerApi.createWorkbook({ id: randomString(6), name: editor.file.path, locale })
      }
      log('[SheetTab]', 'createWorkbook', state)

      // set number format local
      const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
      univerApi?.getActiveWorkbook()?.setNumfmtLocal(localeTag)

      lifeCycleDisposable = univerApi.addEvent(univerApi.Event.LifeCycleChanged, (res) => {
        if (res.stage === LifecycleStages.Rendered) {
          setLoading(false)
          switchTab()
        }
        if (res.stage === LifecycleStages.Steady) {
          const mobileRender = plugin.settings.mobileRenderMode === 'mobile' && Platform.isMobile
          if (mobileRender) {
            const fonts = plugin.availableFonts.map((font: FontInfo) => ({
              value: font.name,
              label: font.name,
              isCustom: true,
            }))
            univerApi.addFonts(fonts)
          }
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
          const customRanges = snapshot.body?.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = state.outgoingLinks || []
                outgoingLinks.remove(normalizedUrl)
                dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
              }
            }
          })

          log('[SheetTab]', 'BeforeCommandExecute CancelOutgoingLinkCommand snapshot', snapshot)
        }
        if (res.id == ReplaceSnapshotCommand.id) {
          const params = res.params as IReplaceSnapshotCommandParams
          log('[SheetTab]', 'BeforeCommandExecute ReplaceSnapshotCommand', params)
          const { snapshot } = params
          const customRanges = snapshot.body?.customRanges
          if (!customRanges) {
            return
          }

          customRanges.forEach((range) => {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url
              if (url) {
                const normalizedUrl = normalizeWikiLink(url)
                const outgoingLinks = state.outgoingLinks || []
                outgoingLinks.remove(normalizedUrl)
                dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
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
          const sourcePath = editor.file.path
          const targetPath = params.link.payload.slice(2, -2)
          const targetFile = app?.vault.getAbstractFileByPath(targetPath)
          const path = app?.metadataCache.fileToLinktext(targetFile, sourcePath, true)
          log('[SheetTab]', 'AddOutgoingLinkCommand', res.params, path)
          if (path) {
            const link = `[[${path}]]`
            const outgoingLinks = state.outgoingLinks || []
            outgoingLinks.push(link)
            dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: outgoingLinks })
          }
        }

        if (res.id === NavigationOutgoingLinkOperation.id) {
          const params = res.params as INavigationOutgoingLinkOperationParams
          if (params.url.startsWith('[[')) {
            app?.workspace.openLinkText(params.url.slice(2, -2), '', 'split')
          }
        }

        // 导入添加 loading 提示
        if (res.id === ImportStartCommand.id) {
          setSpinTip(t('IMPORTING'))
          setLoading(true)
        }

        if (res.id === ImportFinishCommand.id) {
          setLoading(false)
          setSpinTip(t('LOADING'))
        }

        // 仅同步本地 mutation
        if (res.type !== CommandType.MUTATION || res.options?.fromCollab || res.options?.onlyLocal || res.id === 'doc.mutation.rich-text-editing') {
          return
        }

        const activeWorkbook = univerApi.getActiveWorkbook()
        if (activeWorkbook) {
          dispatch({ type: SHEET_UPDATE_ACTION, payload: activeWorkbook.save() })
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

  // 滚动到指定区域
  const scrollToRange = useCallback(() => {
    log('[SheetTab]', 'scrollToRange subPath:', editor.subPath)
    if (editor.subPath && univerApi) {
      const array = editor.subPath.split('|')
      if (array.length !== 2) {
        return
      }
      const sheetName = array[0]
      const rangeString = array[1]
      const rangeNumber = rangeToNumber(rangeString)
      // 打开文件后的子路径，用来选中表格范围
      const activeWorkbook = univerApi.getActiveWorkbook()
      const sheet = activeWorkbook?.getSheetByName(sheetName)
      if (!sheet) {
        return
      }
      activeWorkbook?.setActiveSheet(sheet)
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
  }, [scrollToRange])

  return (
    <Spin spinning={loading} size="large" tip={spinTip}>
      <div id="sheet-box">
        <div ref={containerRef} className="my-univer" />
      </div>
    </Spin>
  )
}
