import type {
  MarkdownPostProcessorContext,
  MetadataCache,
  Vault,
} from 'obsidian'
import {
  TFile,
} from 'obsidian'
import type { IWorkbookData } from '@univerjs/core'
import { UniverInstanceType } from '@univerjs/core'
import { FUniver } from '@univerjs/facade'
import { WorkbookEditablePermission } from '@univerjs/sheets'
import type ExcelProPlugin from './main'

import { getExcelData, getRangeData, renderToHtml } from './utils/data'
import { randomString } from './utils/uuid'
import { createUniver } from './views/setup-univer'

let plugin: ExcelProPlugin
let vault: Vault
let metadataCache: MetadataCache

export function initializeMarkdownPostProcessor(p: ExcelProPlugin) {
  plugin = p
  vault = p.app.vault
  metadataCache = p.app.metadataCache
}

/**
 * markdown 文本处理
 * 在 markdown 中出入 ![[*.univer.md]] 链接，就会触发此方法
 * @param el 父元素
 * @param ctx 上下文
 */
export async function markdownPostProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  // console.log("markdownPostProcessor=============");
  // check to see if we are rendering in editing mode or live preview
  // if yes, then there should be no .internal-embed containers
  const embeddedItems = el.querySelectorAll('.internal-embed')
  // console.log("markdownPostProcessor", embeddedItems.length);
  if (embeddedItems.length === 0) {
    // 编辑模式
    tmpObsidianWYSIWYG(el, ctx)
    return
  }

  // 预览模式
  await processReadingMode(embeddedItems, ctx)
}

// 编辑模式
async function tmpObsidianWYSIWYG(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
  const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath)
  // console.log("tmpObsidianWYSIWYG");
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
    // 鼠标放在 embed link 上弹出的预览页面
    // We are processing the markdown preview of an actual univer file
    // the univer file in markdown preview mode
    const isFrontmatterDiv = Boolean(el.querySelector('.frontmatter'))
    el.empty()
    if (!isFrontmatterDiv) {
      if (el.parentElement === containerEl) {
        containerEl.removeChild(el)
      }
    }
    internalEmbedDiv.empty()

    const data = await vault.read(file)
    const src = internalEmbedDiv.getAttribute('src') ?? ''
    const alt = internalEmbedDiv.getAttribute('alt') ?? ''
    const sheetDiv = createSheetDiv(src, alt, file, data)
    internalEmbedDiv.appendChild(sheetDiv)

    if (markdownEmbed) {
      // display image on canvas without markdown frame
      internalEmbedDiv.removeClass('markdown-embed')
      internalEmbedDiv.removeClass('inline-embed')
    }
    return
  }

  el.empty()

  if (internalEmbedDiv.hasAttribute('ready'))
    return

  internalEmbedDiv.setAttribute('ready', '')

  internalEmbedDiv.empty()

  const data = await vault.read(file)
  const src = internalEmbedDiv.getAttribute('src') ?? ''
  const alt = internalEmbedDiv.getAttribute('alt') ?? ''

  const sheetDiv = createSheetDiv(src, alt, file, data)
  internalEmbedDiv.appendChild(sheetDiv)

  if (markdownEmbed) {
    // display image on canvas without markdown frame
    internalEmbedDiv.removeClass('markdown-embed')
    internalEmbedDiv.removeClass('inline-embed')
  }
}

/**
 * sheet 渲染成 HTML 代码
 * @param excelData excel 数据
 * @param file 文件
 * @param sheet 表格名字
 * @param range 渲染的表格范围
 * @returns HTML代码
 */
function sheetRenderHtml(excelData: IWorkbookData | null, file: TFile, sheet: string, range: string): HTMLDivElement {
  const sheetDiv = createDiv()

  if (plugin.settings.showSheetButton == 'true') {
    const fileEmbed = sheetDiv.createDiv({
      cls: 'internal-embed file-embed mod-generic is-loaded',
      text: file.basename,
      attr: {
        src: file.basename,
        alt: file.basename,
        contenteditable: false,
        tabindex: -1,
      },
    })

    // 点击按钮打开 sheet
    fileEmbed.onClickEvent((e) => {
      e.stopPropagation()
      plugin.app.workspace.getLeaf().openFile(file)
    })
  }

  const div = createDiv({
    cls: 'sheet-html',
    attr: {
      tabindex: '-1',
      contenteditable: 'false',
    },
  })

  if (excelData == null)
    return div

  const table = renderToHtml(excelData, sheet, range)
  div.appendChild(table)
  sheetDiv.appendChild(div)
  return sheetDiv
}

/**
 * 解析 embed link，根据配置渲染成 univer 或者 html
 * @param src 文件路径跟 sheet name
 * @param alt 参数配置
 * @param file 文件信息
 * @param data 文件转换后的 json 字符串
 * @returns
 */
function createSheetDiv(src: string, alt: string, file: TFile, data: string): HTMLDivElement {
  // console.log("createSheetDiv", src, alt)
  // 是否转换成HTML
  let toHTML = false

  if (alt.includes('{html}')) {
    // 单 sheet 中的某一区域
    toHTML = true
    alt = alt.replace('{html}', '')
  }

  let heigh = Number.parseInt(plugin.settings.sheetHeight)
  const matchResult = alt.match(/<(\d+)>/)

  if (matchResult && matchResult.length > 1) {
    const extractedValue = matchResult[1] // 获取匹配到的数字
    //   console.log("Extracted value:", extractedValue);
    heigh = Number.parseInt(extractedValue)
    alt = alt.replace(/<\d+>/, '')
  }

  const split = src.split('#')

  const excelData = getExcelData(data)

  // 生成内容
  if (toHTML) {
    const table = sheetRenderHtml(excelData, file, split[1], alt)
    return table
  }
  else {
    if (split.length > 1) {
      const rangeData = getRangeData(excelData, split[1], alt)
      const sheetDiv = createSheetEl(rangeData, file, heigh)
      return sheetDiv
    }
    else {
      const sheetDiv = createSheetEl(excelData, file, heigh)
      return sheetDiv
    }
  }
}

/**
 * 创建表格元素
 * @param data 数据JSON对象
 * @param file 文件
 * @param height 渲染高度
 * @returns
 */
function createSheetEl(data: IWorkbookData | null, file: TFile, height = 300): HTMLDivElement {
  const sheetDiv = createDiv()

  if (plugin.settings.showSheetButton == 'true') {
    const fileEmbed = sheetDiv.createDiv({
      cls: 'internal-embed file-embed mod-generic is-loaded',
      text: file.basename,
      attr: {
        src: file.basename,
        alt: file.basename,
        contenteditable: false,
        tabindex: -1,
      },
    })

    // 点击按钮打开 sheet
    fileEmbed.onClickEvent((e) => {
      e.stopPropagation()
      plugin.app.workspace.getLeaf().openFile(file)
    })
  }

  const id = `univer-${randomString(6)}`
  const sheetEl = createDiv({
    cls: 'sheet-iframe',
    attr: {
      id,
      style: `height: ${height}px`,
    },
  })

  sheetDiv.appendChild(sheetEl)

  const options = {
    header: false,
    footer: true,
  }
  const univer = createUniver(options, id)

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

  return sheetDiv
}

// 预览模式解析
async function processReadingMode(embeddedItems: NodeListOf<Element> | [HTMLElement], ctx: MarkdownPostProcessorContext) {
  // console.log("processReadingMode")
  // We are processing a non-univer file in reading mode
  // Embedded files will be displayed in an .internal-embed container

  // Iterating all the containers in the file to check which one is an univer drawing
  // This is a for loop instead of embeddedItems.forEach() because processInternalEmbed at the end
  // is awaited, otherwise univer images would not display in the univer plugin
  embeddedItems.forEach(async (maybeUniver, _) => {
    // check to see if the file in the src attribute exists
    // console.log(maybeDrawing);
    const fname = maybeUniver.getAttribute('src')?.split('#')[0]
    if (!fname)
      return true

    const file = metadataCache.getFirstLinkpathDest(fname, ctx.sourcePath)
    // console.log("forEach", file, ctx.sourcePath);

    // if the embeddedFile exits and it is an univer file
    // then lets replace the .internal-embed with the generated PNG or SVG image
    if (file && file instanceof TFile && plugin.isExcelFile(file)) {
      const parent = maybeUniver.parentElement
      const data = await vault.read(file)
      const sheetDiv = processInternalEmbed(maybeUniver, file, data)
      parent?.replaceChild(sheetDiv, maybeUniver)
    }
  })
}

function processInternalEmbed(internalEmbedEl: Element, file: TFile, data: string): HTMLDivElement {
  const src = internalEmbedEl.getAttribute('src')

  if (!src)
    return createDiv()

  // https://github.com/zsviczian/obsidian-excalidraw-plugin/issues/1059
  internalEmbedEl.removeClass('markdown-embed')
  internalEmbedEl.removeClass('inline-embed')

  const alt = internalEmbedEl.getAttribute('alt') ?? ''
  const div = createSheetDiv(src, alt, file, data)
  return div
}
