import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ICellData, INumfmtLocaleTag } from '@univerjs/core'
import { CommandType, LifecycleStages } from '@univerjs/core'
import { AddOutgoingLinkCommand, AddRichOutgoingLinkCommand, CancelOutgoingLinkCommand, CancelRichOutgoingLinkCommand, OutgoingLinkCustomRangeType, SearchOutgoingLinkCommand, SearchResultOutgoingLinkCommand, SheetOutgoingLinkType, UpdateOutgoingLinkCommand, UpdateRichOutgoingLinkCommand } from '@ljcoder/sheets-outgoing-link'
import type { INavigationOutgoingLinkOperationParams } from '@ljcoder/sheets-outgoing-link-ui'
import { NavigationOutgoingLinkOperation } from '@ljcoder/sheets-outgoing-link-ui'
import { ScrollToRangeOperation } from '@univerjs/sheets-ui'
import { SetRangeValuesCommand } from '@univerjs/sheets'
import { InsertSheetDrawingCommand, RemoveSheetDrawingCommand, SHEET_DRAWING_PLUGIN } from '@univerjs/sheets-drawing'
import { Spin } from 'antd'
import { ReplaceSnapshotCommand } from '@univerjs/docs-ui'
import { ExportFinishCommand, ExportStartCommand, ImportFinishCommand, ImportStartCommand } from '@ljcoder/import-export'
import { SaveCommand } from '@ljcoder/save'
import { Platform, TFile } from 'obsidian'
import { createUniver } from '../univer/setup-univer'
import { useEditorContext } from '../../context/editorContext'
import { randomString } from '../../utils/uuid'
import { deepClone, rangeToNumber } from '../../utils/data'
import { Tools, getTheme } from '../../utils/tools'
import { t } from '../../lang/helpers'
import { log } from '../../utils/log'
import { useUniver } from '../../context/UniverContext'
import { useSheetStore } from '../../context/SheetStoreProvider'
import { IMAGES_UPDATE_ACTION, OUTGOING_LINKS_UPDATE_ACTION, SHEET_UPDATE_ACTION } from '../../services/reduce'
import type { FontInfo } from '../../services/fontManager'

// 会改变单元格外链的命令：执行后需从最新 workbook 重建 outgoingLinks，
// 覆盖添加/编辑/删除/禅编辑器/快照替换等所有路径
const OUTGOING_LINK_COMMAND_IDS = new Set([
  AddOutgoingLinkCommand.id,
  UpdateOutgoingLinkCommand.id,
  CancelOutgoingLinkCommand.id,
  AddRichOutgoingLinkCommand.id,
  UpdateRichOutgoingLinkCommand.id,
  CancelRichOutgoingLinkCommand.id,
  ReplaceSnapshotCommand.id,
])

// 会改变表格图片的命令：执行后需从最新 workbook 重建 ### images，
// 覆盖插入/删除浮动图、单元格内嵌图（走 SetRangeValues）与快照替换等路径
const IMAGE_COMMAND_IDS = new Set([
  InsertSheetDrawingCommand.id,
  RemoveSheetDrawingCommand.id,
  SetRangeValuesCommand.id,
  ReplaceSnapshotCommand.id,
])

export function SheetTab({ switchTab }: { switchTab: () => void }) {
  const { state, dispatch } = useSheetStore()
  const { univerApi, setUniverApi } = useUniver()
  const { editor, app } = useEditorContext()
  const { plugin } = editor
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [spinTip, setSpinTip] = useState<string>(t('LOADING'))
  // 保存最新的 store state，供事件回调读取，避免闭包捕获陈旧 state
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    log('[SheetTab]', 'sheetTab 挂载')

    const options = {
      header: true,
      footer: true,
    }
    let darkMode = plugin.settings.darkModal === 'dark'
    // 检查是否在 Excalidraw 中
    const isExalidraw = activeDocument.querySelector('.excalidraw__embeddable-container') !== null
    if (isExalidraw) {
      const theme = getTheme(containerRef.current)
      darkMode = theme === 'dark'
    }

    const mobileRenderMode = plugin.settings.mobileRenderMode
    const { univerAPI, univer } = createUniver(plugin.availableFonts, options, containerRef.current, mobileRenderMode, darkMode)
    setUniverApi(univerAPI)

    return () => {
      log('[SheetTab]', 'sheetTab 卸载')
      // 使用 setTimeout 避免与 React 渲染周期冲突
      window.setTimeout(() => {
        if (univerAPI) {
          log('[SheetTab]', 'disposeUniverAPI', univerAPI)
          univerAPI.dispose()
        }
        if (univer) {
          log('[SheetTab]', 'disposeUniver', univer)
          univer.dispose()
        }
        containerRef.current = null
      }, 0)
    }
  }, [])

  // 把单元格外链 url（[[完整路径]]）统一转成 Obsidian linktext 形式（[[最短唯一名]]），
  // 与「添加外链」时的 fileToLinktext 保持一致，保证编辑/删除能精确匹配 outgoingLinks 条目
  const urlToLinktext = (link: string): string => {
    // 去掉 [[ 和 ]]
    const inner = link.replace(/^\[\[|\]\]$/g, '')
    if (!inner) {
      return ''
    }
    const file = app?.vault.getAbstractFileByPath(inner)
    if (file instanceof TFile && editor.file) {
      const linktext = app?.metadataCache.fileToLinktext(file, editor.file.path, true)
      if (linktext) {
        return `[[${linktext}]]`
      }
    }
    // 目标文件不存在时（如 [[未命名]]），去掉 .md 后缀兜底
    return `[[${inner.replace(/\.md$/i, '')}]]`
  }

  // 从当前 workbook 数据收集全部外链（rangeType === 100 的富文本 customRange），
  // 规范化后与 state 对比，有差异则整体替换，保证 ### outgoingLinks 与表格实际一致
  const syncOutgoingLinksFromWorkbook = () => {
    const workbook = univerApi?.getActiveWorkbook()
    if (!workbook) {
      return
    }
    const data = workbook.save()
    const links: string[] = []
    const sheets = data?.sheets
    if (!sheets) {
      return
    }
    for (const sheetId of Object.keys(sheets)) {
      const cellData = sheets[sheetId]?.cellData
      if (!cellData) {
        continue
      }
      for (const rowKey of Object.keys(cellData)) {
        const row = cellData[Number(rowKey)]
        if (!row) {
          continue
        }
        for (const colKey of Object.keys(row)) {
          const customRanges = row[Number(colKey)]?.p?.body?.customRanges
          if (!customRanges) {
            continue
          }
          for (const range of customRanges) {
            if (range.rangeType === OutgoingLinkCustomRangeType) {
              const url = range.properties?.url as string | undefined
              if (!url) {
                continue
              }
              const normalized = urlToLinktext(url)
              if (normalized && !links.includes(normalized)) {
                links.push(normalized)
              }
            }
          }
        }
      }
    }
    const current = stateRef.current.outgoingLinks || []
    if (links.length !== current.length || links.some((link, i) => link !== current[i])) {
      dispatch({ type: OUTGOING_LINKS_UPDATE_ACTION, payload: links })
    }
  }

  // 从当前 workbook 数据收集全部图片引用（浮动图 + 单元格内嵌图），
  // 规范化后与 state 对比，有差异则整体替换，保证 ### images 与表格实际一致
  const syncImagesFromWorkbook = () => {
    const workbook = univerApi?.getActiveWorkbook()
    if (!workbook) {
      return
    }
    const data = workbook.save()
    const images: string[] = []

    // 递归收集浮动图 drawing.source：快照 resources 中 SHEET_DRAWING_PLUGIN 的 data
    // 是 JSON 字符串，兼容 IDrawingMap 的 { [unitId]: { [subUnitId]: { data, order } } }
    // 与旧版 { [subUnitId]: { data, order } } 两级深度
    const collectDrawingSources = (node: unknown): void => {
      if (!node || typeof node !== 'object') {
        return
      }
      const obj = node as Record<string, unknown>
      // IDrawingMapItem 特征：data 是对象且 order 是数组
      if (obj.data && typeof obj.data === 'object' && Array.isArray(obj.order)) {
        for (const drawing of Object.values(obj.data as Record<string, unknown>)) {
          const source = (drawing as Record<string, unknown>)?.source as string | undefined
          if (!source) {
            continue
          }
          const normalized = urlToLinktext(source)
          if (normalized && !images.includes(normalized)) {
            images.push(normalized)
          }
        }
        return
      }
      for (const value of Object.values(obj)) {
        collectDrawingSources(value)
      }
    }

    // 1. 浮动图：resources 中 SHEET_DRAWING_PLUGIN 条目（运行时由 sheetDrawingService 实时序列化）
    for (const resource of data?.resources ?? []) {
      if (resource.name !== SHEET_DRAWING_PLUGIN || typeof resource.data !== 'string') {
        continue
      }
      try {
        collectDrawingSources(JSON.parse(resource.data))
      }
      catch {
        // 解析失败忽略，保持区块不变
      }
    }

    // 2. 单元格内嵌图：cellData.p.drawings 中的 drawing.source
    const sheets = data?.sheets
    if (sheets) {
      for (const sheetId of Object.keys(sheets)) {
        const cellData = sheets[sheetId]?.cellData as Record<string, Record<string, ICellData> | undefined>
        if (!cellData) {
          continue
        }
        for (const rowKey of Object.keys(cellData)) {
          const row = cellData[rowKey]
          if (!row) {
            continue
          }
          for (const colKey of Object.keys(row)) {
            const drawings = row[colKey]?.p?.drawings as Record<string, { source?: unknown }> | undefined
            if (!drawings) {
              continue
            }
            for (const drawing of Object.values(drawings)) {
              const source = drawing.source as string | undefined
              if (!source) {
                continue
              }
              const normalized = urlToLinktext(source)
              if (normalized && !images.includes(normalized)) {
                images.push(normalized)
              }
            }
          }
        }
      }
    }

    const current = stateRef.current.images || []
    if (images.length !== current.length || images.some((img, i) => img !== current[i])) {
      dispatch({ type: IMAGES_UPDATE_ACTION, payload: images })
    }
  }

  useEffect(() => {
    let lifeCycleDisposable: { dispose: () => void } | null = null
    let commandExecutedDisposable: { dispose: () => void } | null = null
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
          if (Platform.isMobileApp && plugin.settings.mobileRenderMode !== 'mobile') {
            const fonts = plugin.availableFonts.map((font: FontInfo) => ({
              value: font.name,
              label: font.name,
              isCustom: true,
            }))
            univerApi.addFonts(fonts)
          }
        }
      })

      commandExecutedDisposable = univerApi.addEvent(univerApi.Event.CommandExecuted, (res) => {
        if (res.id === SaveCommand.id) {
          log('[SheetTab]', 'SaveCommandExecuted')
          editor.debounced.run()
        }
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

        // 外链相关命令执行后：从最新 workbook 重建 outgoingLinks，
        // 覆盖添加/编辑/删除/禅编辑器/快照替换等所有路径，避免分步同步的竞态与遗漏
        if (OUTGOING_LINK_COMMAND_IDS.has(res.id)) {
          syncOutgoingLinksFromWorkbook()
        }

        // 图片相关命令执行后：从最新 workbook 重建 ### images，
        // 覆盖插入/删除浮动图、单元格内嵌图与快照替换等所有路径
        if (IMAGE_COMMAND_IDS.has(res.id)) {
          syncImagesFromWorkbook()
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
          // 导入完成后同步新工作簿数据到 store，触发保存
          const activeWorkbook = univerApi.getActiveWorkbook()
          if (activeWorkbook) {
            dispatch({ type: SHEET_UPDATE_ACTION, payload: activeWorkbook.save() })
          }
        }

        if (res.id === ExportStartCommand.id) {
          log('[SheetTab]', 'ExportStartCommand')
          setLoading(true)
          setSpinTip(t('EXPORTING'))
        }

        if (res.id === ExportFinishCommand.id) {
          log('[SheetTab]', 'ExportFinishCommand')
          setLoading(false)
          setSpinTip(t('EXPORTED'))
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
    <Spin spinning={loading} size="large" description={spinTip}>
      <div id="sheet-box">
        <div ref={containerRef} className="lj-univer" />
      </div>
    </Spin>
  )
}
