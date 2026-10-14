import type { MarkdownPostProcessorContext, MetadataCache, Vault } from 'obsidian'
import { TFile } from 'obsidian'

import { createEchartsEl, log } from '@ljcoder/smart-sheet'
import type { IWorkbookData } from '@univerjs/core'
import { getCurrencySymbolByLocale } from '@univerjs/sheets-numfmt'
import type ExcelProPlugin from '../main'

import { VIEW_TYPE_EXCEL_PRO } from '../common/constants'
import { t } from '../lang/helpers'
import { getExcelData, getRangeData, getSheetData } from '../utils/data'
import { Tools } from '../utils/tools'

import type { FormulaEmbed } from './embed-syntax'
import { parseEmbedLink } from './embed-syntax'
import { beginRender } from './embed-refresh'
import { evaluateEmbedFormula } from './formula'
import { attachFormatMenu } from './formula-menu'
import { renderFormulaView, startRun, toFormulaView } from './formula-render'
import { renderToHtml } from './html'
import { createUniverEl } from './univer'

let plugin: ExcelProPlugin
let vault: Vault
let metadataCache: MetadataCache

export function initializeMarkdownPostProcessor(p: ExcelProPlugin) {
  plugin = p
  vault = p.app.vault
  metadataCache = p.app.metadataCache

  p.registerEvent(
    vault.on('modify', (file) => {
      if (file instanceof TFile && plugin.isExcelFile(file)) {
        void reRenderEmbeddedContent(file)
      }
    }),
  )
}

/**
 * 计算自适应高度
 * - 嵌入 Canvas 时使用父元素高度
 * - 否则根据数据中所有可见行的行高累加计算
 */
function computeAdaptiveHeight(data: IWorkbookData | null, parentEl: HTMLElement): number {
  // 嵌入 Canvas 中时使用父元素高度
  const canvasContent = parentEl.closest('.canvas-node-content')
  log('[computeAdaptiveHeight]', 'canvasContent:', canvasContent)
  if (canvasContent) {
    const canvasHeight = (canvasContent as HTMLElement).clientHeight || 500
    log('[computeAdaptiveHeight]', 'Canvas mode, parent height:', canvasHeight)
    return canvasHeight
  }

  if (!data || !data.sheets) {
    log('[computeAdaptiveHeight]', 'no data or sheets, fallback 300')
    return 300
  }

  const sheetId = Object.keys(data.sheets)[0]
  if (!sheetId) {
    log('[computeAdaptiveHeight]', 'no sheetId, fallback 300')
    return 300
  }

  const sheet = data.sheets[sheetId]
  const defaultRowHeight = sheet.defaultRowHeight || 25

  // 列标题高度 + 所有可见行的高度
  let totalHeight = sheet.columnHeader?.height || 20
  let visibleRowCount = 0
  for (let i = 0; i < (sheet.rowCount || 0); i++) {
    const rowData = sheet.rowData?.[i]
    if (rowData?.hd === 1) {
      continue // 跳过隐藏行
    }
    visibleRowCount++
    totalHeight += rowData?.h || defaultRowHeight
  }

  log('[computeAdaptiveHeight]', 'calculated height:', totalHeight, 'rows:', sheet.rowCount, 'visible:', visibleRowCount, 'defaultRowHeight:', defaultRowHeight)
  return totalHeight || 300
}

/**
 * 解析嵌入表格的渲染高度
 * 优先级：嵌入语法显式高度 > 自定义模式的有效高度 > 自适应计算
 * @param plugin 插件实例（读取 sheetHeightMode / sheetHeight 设置）
 * @param data 表格数据（用于自适应计算）
 * @param parentEl 父元素（用于 canvas 模式的自适应计算）
 * @param explicitHeight 嵌入语法显式指定的高度（可选）
 */
function resolveEmbedHeight(
  plugin: ExcelProPlugin,
  data: IWorkbookData | null,
  parentEl?: HTMLElement,
  explicitHeight?: number,
): number | undefined {
  // 嵌入语法显式指定高度时优先（用 !== undefined 判断以兼容显式 0，保持与现状 ?? 语义一致）
  if (explicitHeight !== undefined)
    return explicitHeight
  // 自定义模式：使用用户指定的默认高度（无效值时回退自适应）
  if (plugin.settings.sheetHeightMode === 'custom') {
    const height = Number.parseInt(plugin.settings.sheetHeight, 10)
    if (Number.isFinite(height) && height > 0)
      return height
  }
  // 自适应模式（含自定义值无效时的回退）
  return parentEl ? computeAdaptiveHeight(data, parentEl) : undefined
}

/**
 * 解析 HTML 嵌入的渲染高度
 * 优先级：嵌入语法显式高度 > 自定义模式有效高度 > 不限制（内容自然高度）
 * HTML 为静态内容，auto 模式即内容自然高度，无需行高累加计算
 */
function resolveHtmlEmbedHeight(plugin: ExcelProPlugin, explicitHeight?: number): number | undefined {
  // 嵌入语法显式指定高度时优先（含 0）
  if (explicitHeight !== undefined)
    return explicitHeight
  // 自定义模式：使用用户指定的默认高度（无效值时回退内容自然高度）
  if (plugin.settings.sheetHeightMode === 'custom') {
    const height = Number.parseInt(plugin.settings.sheetHeight, 10)
    if (Number.isFinite(height) && height > 0)
      return height
  }
  // auto：不设高度，由内容撑开
  return undefined
}

interface FormulaEmbedOptions {
  formula: string
  sheetName?: string
  format?: string
}

/** Evaluates a formula embed and renders the result into `el`, unless a newer run started. */
async function fillFormulaEmbed(el: HTMLElement, data: IWorkbookData, options: FormulaEmbedOptions) {
  const isLatest = startRun(el)
  const result = await evaluateEmbedFormula(data, options.sheetName, options.formula)
  if (isLatest())
    renderFormulaView(el, toFormulaView(result, options.format), t)
}

/** An inline span: `…` at first, then the value, a table or #ERROR. */
function createFormulaEmbedEl(parsed: FormulaEmbed, src: string, alt: string, file: TFile, data: IWorkbookData): HTMLElement {
  const el = createSpan({ cls: 'lj-formula-embed', text: '…' })
  el.setAttr('data-file-path', file.path)
  el.setAttr('data-sheet-name', parsed.sheetName ?? '')
  el.setAttr('data-formula', parsed.formula)
  el.setAttr('data-format', parsed.format ?? '')
  // the link text as written, to find it again in the note
  el.setAttr('data-embed-src', src)
  el.setAttr('data-embed-alt', alt)
  attachFormatMenu(el, plugin.app, getCurrencySymbolByLocale(Tools.convertNumberFormatLocalToLocaleType(plugin.settings.numberFormatLocal)))
  void fillFormulaEmbed(el, data, parsed)
  return el
}

async function reRenderEmbeddedContent(file: TFile) {
  const selector = [
    `.lj-table-box[data-file-path="${file.path}"]`,
    `.lj-embed-content[data-file-path="${file.path}"]`,
    `.lj-formula-embed[data-file-path="${file.path}"]`,
  ].join(',')
  const elements = activeDocument.querySelectorAll(selector)
  if (elements.length === 0) {
    return
  }

  log('[reRenderEmbeddedContent]', file.path, elements)

  const data = await vault.read(file)

  for (const el of elements) {
    // each embed gets its own copy: getRangeData, getSheetData and createWorkbook all modify
    // the data they are given, which would corrupt every embed after the first
    const excelData = getExcelData(data, file)
    if (!excelData) {
      return
    }

    if (el.classList.contains('lj-formula-embed')) {
      void fillFormulaEmbed(el as HTMLElement, excelData, {
        formula: el.getAttribute('data-formula') || '',
        sheetName: el.getAttribute('data-sheet-name') || undefined,
        format: el.getAttribute('data-format') || undefined,
      })
      continue
    }

    const sheetName = el.getAttribute('data-sheet-name') || ''
    const range = el.getAttribute('data-range') || ''
    const displayType = el.getAttribute('data-display-type') || 'univer'
    const parsesRange = range && range !== ':'

    log('[reRenderEmbeddedContent]', file.path, sheetName, range, displayType, parsesRange)
    el.empty()

    if (displayType === 'html') {
      const validRange = parsesRange && !range.includes('undefined') ? range : ''
      const tableEl = await renderToHtml(excelData, sheetName, validRange, resolveHtmlEmbedHeight(plugin))
      el.appendChild(tableEl)
    }
    else if (displayType === 'univer') {
      if (parsesRange) {
        const rangeData = getRangeData(excelData, sheetName, range)
        const height = resolveEmbedHeight(plugin, rangeData, el as HTMLElement)
        const univerEl = createUniverEl(rangeData, height, plugin.settings.embedLinkShowFooter === 'true', plugin)
        el.appendChild(univerEl)
      }
      else {
        const sheetData = getSheetData(excelData, sheetName)
        const height = resolveEmbedHeight(plugin, sheetData, el as HTMLElement)
        const univerEl = createUniverEl(sheetData, height, plugin.settings.embedLinkShowFooter === 'true', plugin)
        el.appendChild(univerEl)
      }
    }
    else if (displayType.contains('chart')) {
      const chartsEl = createEchartsEl(plugin.settings.darkModal === 'dark', excelData, sheetName, range, displayType, undefined)
      el.appendChild(chartsEl)
    }
  }
}

/**
 * markdown 文本处理
 * 在 markdown 中出输入 ![[*.univer.md]] 链接，就会触发此方法
 * @param el 父元素
 * @param ctx 上下文
 */
export async function markdownPostProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  // check to see if we are rendering in editing mode or live preview
  // if yes, then there should be no .internal-embed containers
  const embeddedItems = el.querySelectorAll('.internal-embed')
  log('[markdownPostProcessor]', ctx, embeddedItems)
  if (embeddedItems.length === 0) {
    // 编辑模式
    await tmpObsidianWYSIWYG(el, ctx)
    return
  }

  // 预览模式
  await processReadingMode(embeddedItems, ctx)
}

// 编辑模式
async function tmpObsidianWYSIWYG(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath)
  log('[tmpObsidianWYSIWYG]', ctx, el)
  if (!(file instanceof TFile))
    return
  if (!plugin.isExcelFile(file))
    return

  // @ts-expect-error
  if (ctx.remainingNestLevel < 4)
    return

  // @ts-expect-error
  const containerEl = ctx.containerEl
  let internalEmbedDiv: HTMLElement = containerEl
  while (
    !internalEmbedDiv.hasClass('dataview')
    && !internalEmbedDiv.hasClass('cm-preview-code-block')
    && !internalEmbedDiv.hasClass('cm-embed-block')
    && !internalEmbedDiv.hasClass('internal-embed')
    && !internalEmbedDiv.hasClass('markdown-reading-view')
    && !internalEmbedDiv.hasClass('markdown-embed')
    && internalEmbedDiv.parentElement
  ) {
    internalEmbedDiv = internalEmbedDiv.parentElement
  }

  if (
    internalEmbedDiv.hasClass('dataview')
    || internalEmbedDiv.hasClass('cm-preview-code-block')
    || internalEmbedDiv.hasClass('cm-embed-block')
  ) {
    return
  } // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/835

  const markdownEmbed = internalEmbedDiv.hasClass('markdown-embed')
  const markdownReadingView = internalEmbedDiv.hasClass(
    'markdown-reading-view',
  )
  if (
    !internalEmbedDiv.hasClass('internal-embed')
    && (markdownEmbed || markdownReadingView)
  ) {
    // console.log('预览', containerEl)
    // 鼠标放在 embed link 上弹出的预览页面
    // We are processing the markdown preview of an actual univer file
    // the univer file in markdown preview mode
    const isFrontmatterDiv = Boolean(el.querySelector('.frontmatter'))
    if (ctx.frontmatter) {
      el.empty()
    }

    if (!isFrontmatterDiv) {
      if (el.parentElement === containerEl) {
        containerEl.removeChild(el)
      }
    }
    internalEmbedDiv.empty()

    const data = await vault.read(file)
    const src = internalEmbedDiv.getAttribute('src') ?? file.path.slice(0, -(file.extension.length + 1))
    const alt = internalEmbedDiv.getAttribute('alt') ?? ''
    const sheetDiv = await createEmbedLinkDiv(src, alt, file, data, internalEmbedDiv)
    internalEmbedDiv.appendChild(sheetDiv)

    if (markdownEmbed) {
      // display image on canvas without markdown frame
      internalEmbedDiv.removeClass('markdown-embed')
      internalEmbedDiv.removeClass('inline-embed')
    }
    return
  }

  el.empty()

  watchEmbedLink(internalEmbedDiv, file, markdownEmbed)
  await renderLivePreviewEmbed(internalEmbedDiv, file, markdownEmbed)
}

const LINK_EDIT_DEBOUNCE_MS = 300
const watchedEmbeds = new WeakSet<HTMLElement>()

/**
 * Live Preview keeps the embed element when its link text is edited and only updates its
 * src and alt attributes, so watch them and re-render once typing pauses.
 */
function watchEmbedLink(internalEmbedDiv: HTMLElement, file: TFile, markdownEmbed: boolean) {
  if (watchedEmbeds.has(internalEmbedDiv))
    return
  watchedEmbeds.add(internalEmbedDiv)

  const linkedFile = internalEmbedDiv.getAttribute('src')?.split('#')[0]
  let timer: number | undefined
  new MutationObserver(() => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      // a link to another file gets a new embed element from Obsidian
      if (internalEmbedDiv.getAttribute('src')?.split('#')[0] === linkedFile)
        void renderLivePreviewEmbed(internalEmbedDiv, file, markdownEmbed)
    }, LINK_EDIT_DEBOUNCE_MS)
  }).observe(internalEmbedDiv, { attributes: true, attributeFilter: ['src', 'alt'] })
}

/** Renders the embed for its current link text; does nothing if that link is already shown. */
async function renderLivePreviewEmbed(internalEmbedDiv: HTMLElement, file: TFile, markdownEmbed: boolean) {
  const src = internalEmbedDiv.getAttribute('src') ?? file.path.slice(0, -(file.extension.length + 1))
  const alt = internalEmbedDiv.getAttribute('alt') ?? ''
  const isCurrent = beginRender(internalEmbedDiv, `${src}|${alt}`)
  if (!isCurrent)
    return

  const data = await vault.read(file)
  const sheetDiv = await createEmbedLinkDiv(src, alt, file, data, internalEmbedDiv)
  // a newer edit started its own render while this one was loading
  if (!isCurrent())
    return

  internalEmbedDiv.empty()
  internalEmbedDiv.appendChild(sheetDiv)

  if (markdownEmbed) {
    // display image on canvas without markdown frame
    internalEmbedDiv.removeClass('markdown-embed')
    internalEmbedDiv.removeClass('inline-embed')
  }
}

// 预览模式解析
async function processReadingMode(embeddedItems: NodeListOf<Element> | [HTMLElement], ctx: MarkdownPostProcessorContext) {
  log('[processReadingMode]', ctx, embeddedItems)
  // We are processing a non-univer file in reading mode
  // Embedded files will be displayed in an .internal-embed container

  // Iterating all the containers in the file to check which one is an univer drawing
  for (const maybeUniver of embeddedItems) {
    const fname = maybeUniver.getAttribute('src')?.split('#')[0]
    if (!fname)
      continue

    const file = metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath)

    if (file && file instanceof TFile && plugin.isExcelFile(file)) {
      const parent = maybeUniver.parentElement
      const data = await vault.read(file)
      const sheetDiv = await processInternalEmbed(maybeUniver, file, data)
      parent?.replaceChild(sheetDiv, maybeUniver)
    }
  }
}

async function processInternalEmbed(internalEmbedEl: Element, file: TFile, data: string): Promise<HTMLElement> {
  log('[processInternalEmbed]', internalEmbedEl, file)
  const src = internalEmbedEl.getAttribute('src')

  if (!src)
    return createDiv()

  // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/1059
  internalEmbedEl.removeClass('markdown-embed')
  internalEmbedEl.removeClass('inline-embed')

  const alt = internalEmbedEl.getAttribute('alt') ?? ''
  const div = await createEmbedLinkDiv(src, alt, file, data, internalEmbedEl as HTMLElement)
  return div
}

/**
 * 解析 embed link，根据配置渲染成不同的元素
 * @param src 文件路径跟 sheetName， 例如: Excel 2024-06-05 16.27.15#Sheet1
 * @param alt 参数配置 例如: A1:C7<100>{html}
 * @param file 文件信息
 * @param data 文件转换后的 json 字符串
 * @returns HTMLDivElement
 */
async function createEmbedLinkDiv(src: string, alt: string, file: TFile, data: string, parentEl?: HTMLElement): Promise<HTMLElement> {
  const parseResult = parseEmbedLink(src, alt)
  log('[createEmbedLinkDiv]', src, alt, file.path)

  const excelData = getExcelData(data, file)
  if (!excelData) {
    return createDiv('No Data')
  }

  if (parseResult.kind === 'formula')
    return createFormulaEmbedEl(parseResult, src, alt, file, excelData)

  const embedLinkDiv = createDiv()

  if (plugin.settings.showSheetButton === 'true') {
    const fileEmbed = embedLinkDiv.createDiv({
      cls: 'internal-embed file-embed mod-generic is-loaded',
      text: file.basename,
      attr: {
        src: file.basename,
        alt: file.basename,
      },
    })

    // 点击按钮打开 sheet
    fileEmbed.onClickEvent((e) => {
      e.stopPropagation()
      const openMode = plugin.settings.embedLinkOpenMode || 'split-right'
      const subpath = `${parseResult.sheetName}|${parseResult.startCell}:${parseResult.endCell}`
      if (openMode === 'current-tab') {
        const leaf = plugin.app.workspace.getLeaf(false)
        leaf.openFile(file, {
          active: true,
          eState: { subpath },
          state: { type: VIEW_TYPE_EXCEL_PRO },
        }).then(() => {
          return plugin.setExcelView(leaf)
        })
      }
      else {
        plugin.openExcel(file, 'split-right', true, subpath)
      }
    })
  }

  // 生成内容
  if (parseResult.displayType === 'html') {
    const rangeStr = parseResult.startCell && parseResult.endCell
      ? `${parseResult.startCell}:${parseResult.endCell}`
      : ''
    const tableEl = await renderToHtml(excelData, parseResult.sheetName || '', rangeStr, resolveHtmlEmbedHeight(plugin, parseResult.height))
    const tableBox = createDiv({ cls: 'lj-table-box' })
    tableBox.setAttr('data-file-path', file.path)
    tableBox.setAttr('data-sheet-name', parseResult.sheetName || '')
    tableBox.setAttr('data-range', rangeStr)
    tableBox.setAttr('data-display-type', 'html')
    tableBox.appendChild(tableEl)
    embedLinkDiv.appendChild(tableBox)
    return embedLinkDiv
  }
  else if (parseResult.displayType === undefined) {
    const contentWrapper = createDiv({ cls: 'lj-embed-content' })
    contentWrapper.setAttr('data-file-path', file.path)
    contentWrapper.setAttr('data-sheet-name', parseResult.sheetName ?? '')
    contentWrapper.setAttr('data-range', `${parseResult.startCell}:${parseResult.endCell}`)
    contentWrapper.setAttr('data-display-type', 'univer')
    if (parseResult.startCell && parseResult.endCell) {
      const rangeData = getRangeData(excelData, parseResult.sheetName ?? '', `${parseResult.startCell}:${parseResult.endCell}`)
      const height = resolveEmbedHeight(plugin, rangeData, parentEl, parseResult.height)
      const univerEl = createUniverEl(rangeData, height, plugin.settings.embedLinkShowFooter === 'true', plugin)
      contentWrapper.appendChild(univerEl)
    }
    else {
      const sheetData = getSheetData(excelData, parseResult.sheetName ?? '')
      const height = resolveEmbedHeight(plugin, sheetData, parentEl, parseResult.height)
      const univerEl = createUniverEl(sheetData, height, plugin.settings.embedLinkShowFooter === 'true', plugin)
      contentWrapper.appendChild(univerEl)
    }
    embedLinkDiv.appendChild(contentWrapper)
    return embedLinkDiv
  }
  else if (parseResult.displayType?.contains('chart')) {
    const contentWrapper = createDiv({ cls: 'lj-embed-content' })
    contentWrapper.setAttr('data-file-path', file.path)
    contentWrapper.setAttr('data-sheet-name', parseResult.sheetName ?? '')
    contentWrapper.setAttr('data-range', `${parseResult.startCell}:${parseResult.endCell}`)
    contentWrapper.setAttr('data-display-type', parseResult.displayType)
    const chartsEl = createEchartsEl(plugin.settings.darkModal === 'dark', excelData, parseResult.sheetName ?? '', `${parseResult.startCell}:${parseResult.endCell}`, parseResult.displayType, parseResult.height)
    contentWrapper.appendChild(chartsEl)
    embedLinkDiv.appendChild(contentWrapper)
    return embedLinkDiv
  }
  else {
    return embedLinkDiv
  }
}
