import type { INumfmtLocaleTag, IWorkbookData } from '@univerjs/core'
import type { Univer } from '@univerjs/core'
import { log, warn } from '@ljcoder/smart-sheet/src/utils/log'
import type { FUniver } from '@univerjs/core/facade'
import type { FWorksheet } from '@univerjs/sheets/facade'
import { randomString } from '../utils/uuid'
import { applyWorkbookDefaultFont } from '../utils/tools'
import { createUniver } from '../views/univer/setup-univer'
import type ExcelProPlugin from '../main'

const embedUniverMap = new Map<string, { univerAPI: FUniver, univer: Univer }>()

function disposeEmbedUniver(id: string) {
  const instance = embedUniverMap.get(id)
  if (instance) {
    try {
      const fWorkbook = instance.univerAPI.getActiveWorkbook()
      const unitId = fWorkbook?.getId()
      if (unitId) {
        instance.univerAPI.disposeUnit(unitId)
      }
      instance.univerAPI.dispose()
      instance.univer.dispose()
    }
    catch (e) {
      warn('[disposeEmbedUniver]', 'Error disposing embed univer:', e)
    }
    embedUniverMap.delete(id)
  }
}

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

  let isCanvasMode = false
  let canvasParent: Element | null = null
  let canvasResizeObserver: ResizeObserver | null = null

  // 等待元素挂载后检测环境并初始化（仅一次）
  const mountObserver = new MutationObserver(() => {
    void (async () => {
      if (activeDocument.getElementById(id)) {
        log('[createUniverEl]', 'Univer container mounted')
        mountObserver.disconnect()

        // 追踪 .canvas-wrapper 祖先：虚拟滚动时它不变，文件关闭时才移除
        canvasParent = univerEl.closest('.canvas-wrapper')
        isCanvasMode = !!canvasParent
        log('[createUniverEl]', 'Canvas mode:', isCanvasMode, 'leaf:', canvasParent)

        // 监听包含当前 univerEl 的 .canvas-node 高度变化，同步更新 Univer 高度
        if (isCanvasMode && canvasParent) {
          const canvasNode = univerEl.closest('.canvas-node')
          if (canvasNode) {
            canvasResizeObserver = new ResizeObserver((entries) => {
              for (const entry of entries) {
                const newHeight = entry.contentRect.height
                if (newHeight > 0 && univerEl.style.height !== `${newHeight}px`) {
                  univerEl.style.height = `${newHeight}px`
                }
              }
            })
            canvasResizeObserver.observe(canvasNode)
          }
        }

        await initUniver(univerEl, id, data, plugin, showFooter)
      }
    })()
  })

  mountObserver.observe(activeDocument.body, { childList: true, subtree: true })

  // 监听元素从 DOM 移除
  const unmountObserver = new MutationObserver(() => {
    if (!activeDocument.getElementById(id)) {
      if (isCanvasMode) {
        // canvas 祖先还在 DOM → 仅虚拟滚动，保持实例存活
        // canvas 祖先也不在 DOM → 文件已关闭，销毁实例
        if (canvasParent && !activeDocument.contains(canvasParent)) {
          log('[createUniverEl]', 'Canvas closed, disposing')
          unmountObserver.disconnect()
          canvasResizeObserver?.disconnect()
          disposeEmbedUniver(id)
        }
        else {
          log('[createUniverEl]', 'Canvas scrolled out, keeping alive')
        }
      }
      else {
        log('[createUniverEl]', 'Univer container removed from DOM, disposing')
        unmountObserver.disconnect()
        canvasResizeObserver?.disconnect()
        disposeEmbedUniver(id)
      }
    }
  })

  unmountObserver.observe(activeDocument.body, { childList: true, subtree: true })

  return univerEl
}

async function initUniver(el: HTMLDivElement, id: string, data: IWorkbookData | null, plugin: ExcelProPlugin, showFooter: boolean): Promise<FUniver> {
  log('[createUniverEl]', `Univer container initialized: ${id}`, data)
  // 确认容器尺寸正常再初始化
  if (el.offsetWidth === 0 || el.offsetHeight === 0) {
    warn('[createUniverEl]', 'Univer container has zero size, check CSS')
  }

  // 如果已有旧实例，先销毁
  disposeEmbedUniver(id)

  const options = {
    header: false,
    contextMenu: false,
    footer: showFooter,
  }
  const darkMode = plugin.settings.darkModal === 'dark'
  const { univerAPI, univer } = createUniver(plugin.availableFonts, options, id, plugin.settings.mobileRenderMode, darkMode, true, plugin.settings.rtlDirection)

  embedUniverMap.set(id, { univerAPI, univer })

  if (data) {
    // workbookData 的内容都包含在 workbook 字段中
    const workbookData: IWorkbookData = data
    univerAPI.createWorkbook(workbookData)
  }
  else {
    univerAPI.createWorkbook({})
  }
  // 创建后立即应用默认字体：Univer 只消费 worksheet 级 defaultStyle，需对已创建的 worksheet 设置
  applyWorkbookDefaultFont(univer, plugin.settings.defaultFontFamily)

  const activeWorkbook = univerAPI.getActiveWorkbook()

  const localeTag = plugin.settings.numberFormatLocal as INumfmtLocaleTag
  activeWorkbook?.setNumfmtLocal(localeTag)

  univerAPI.addEvent(univerAPI.Event.LifeCycleChanged, ({ stage }) => {
    if (stage === univerAPI.Enum.LifecycleStages.Rendered) {
      const fWorkbook = univerAPI.getActiveWorkbook()!

      // disable selection
      fWorkbook.disableSelection()

      // set read only
      const permission = fWorkbook.getWorkbookPermission()
      permission.setReadOnly()
      // 无权限弹窗开关挂在 FUniver（@univerjs/sheets-ui facade）上，不在 workbook permission 对象上
      univerAPI.setPermissionDialogVisible(false)
    }
  })

  return univerAPI
}

/**
 * 用临时（隐藏的）Univer 实例真实计算公式单元格的显示值。
 * 公式在 workbook 创建时被强制计算（CalculationMode.FORCED），取到显示值后立即销毁实例。
 * 仅在单格嵌入遇到「公式无缓存结果」时调用。
 */
export async function computeCellText(
  data: IWorkbookData | null,
  sheetName: string | undefined,
  cellRef: string,
): Promise<string | undefined> {
  const id = `univer-calc-${randomString(6)}`
  const hostEl = createDiv({ attr: { id, style: 'display: none;' } })
  activeDocument.body.append(hostEl)

  let univerAPI: FUniver | undefined
  let univer: Univer | undefined
  try {
    const options = { header: false, contextMenu: false, footer: false }
    const created = createUniver([], options, id, 'desktop', false, true)
    univerAPI = created.univerAPI
    univer = created.univer

    const fWorkbook = univerAPI.createWorkbook(data ?? {})
    const fSheet = sheetName ? fWorkbook.getSheetByName(sheetName) : fWorkbook.getActiveSheet()
    if (!fSheet)
      return undefined

    return await readDisplayValue(fSheet, cellRef)
  }
  catch (e) {
    warn('[computeCellText]', 'Error computing cell value:', e)
    return undefined
  }
  finally {
    try {
      const unitId = univerAPI?.getActiveWorkbook()?.getId()
      if (unitId)
        univerAPI?.disposeUnit(unitId)
      univerAPI?.dispose()
      univer?.dispose()
    }
    catch (e) {
      warn('[computeCellText]', 'Error disposing temp univer:', e)
    }
    hostEl.remove()
  }
}

/**
 * 轮询读取单元格显示值：公式引擎算完前读到的是空值，需要等待结果就绪。
 * 超过 timeoutMs 仍未算完时返回 undefined，避免无限等待。
 */
async function readDisplayValue(fSheet: FWorksheet, cellRef: string, timeoutMs = 3000): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const display = fSheet.getRange(cellRef).getDisplayValue()
      if (display !== undefined && display !== null && display !== '')
        return String(display)
    }
    catch {
      // 引擎尚未就绪时读取会抛异常，忽略后继续轮询
    }
    await new Promise(resolve => window.setTimeout(resolve, 50))
  }
  return undefined
}
