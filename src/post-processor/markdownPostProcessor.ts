import type { MarkdownPostProcessorContext, MetadataCache, Vault } from 'obsidian'
import { TFile } from 'obsidian'

import { createEchartsEl } from '@ljcoder/embed-link'
import type ExcelProPlugin from '../main'

import { getExcelData, getRangeData } from '../utils/data'

import { renderToHtml } from './html'
import { createUniverEl } from './univer'

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
  // console.log('tmpObsidianWYSIWYG', ctx.sourcePath, file)
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
    const sheetDiv = createEmbedLinkDiv(src, alt, file, data)
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

  const sheetDiv = createEmbedLinkDiv(src, alt, file, data)
  internalEmbedDiv.appendChild(sheetDiv)

  if (markdownEmbed) {
    // display image on canvas without markdown frame
    internalEmbedDiv.removeClass('markdown-embed')
    internalEmbedDiv.removeClass('inline-embed')
  }
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
    // console.log('forEach', file, ctx.sourcePath)

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
  const div = createEmbedLinkDiv(src, alt, file, data)
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
function createEmbedLinkDiv(src: string, alt: string, file: TFile, data: string): HTMLDivElement {
  // console.log('createEmbedLinkDiv', src, alt)
  const parseResult = parseEmbedLinkSyntax(`${src}|${alt}`)

  const excelData = getExcelData(data, file)

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
      plugin.app.workspace.getLeaf().openFile(file, { state: {
        sheetName: parseResult.sheetName,
        startCell: parseResult.startCell,
        endCell: parseResult.endCell,
      } })
    })
  }

  // 生成内容
  if (parseResult.displayType === 'html') {
    const tableEl = renderToHtml(excelData, parseResult.sheetName, `${parseResult.startCell}:${parseResult.endCell}`)
    embedLinkDiv.appendChild(tableEl)
    return embedLinkDiv
  }
  else if (parseResult.displayType === undefined) {
    if (parseResult.startCell && parseResult.endCell) {
      const rangeData = getRangeData(excelData, parseResult.sheetName, `${parseResult.startCell}:${parseResult.endCell}`)
      const univerEl = createUniverEl(rangeData, parseResult.height)
      embedLinkDiv.appendChild(univerEl)
      return embedLinkDiv
    }
    else {
      const univerEl = createUniverEl(excelData, parseResult.height)
      embedLinkDiv.appendChild(univerEl)
      return embedLinkDiv
    }
  }
  else if (parseResult.displayType.contains('chart')) {
    const chartsEl = createEchartsEl(excelData, parseResult.sheetName, `${parseResult.startCell}:${parseResult.endCell}`, parseResult.displayType, parseResult.height)
    embedLinkDiv.appendChild(chartsEl)
    return embedLinkDiv
  }
}

interface ParsedSyntax {
  filePath?: string
  fileName: string
  sheetName: string
  startCell?: string // Optional start cell
  endCell?: string // Optional end cell
  height?: number // Optional height
  displayType?: string // Optional display type
}

function parseEmbedLinkSyntax(input: string): ParsedSyntax {
  // 首先分离路径和文件名及其后的语法部分
  const pathParts = input.split('/')
  const filePath = pathParts.slice(0, -1).join('/')
  const fileNameAndRest = pathParts[pathParts.length - 1]

  const fileRegex = /^([\w\-.\s]+)#([\w\s]+)(?:\|([A-Z]\d+):([A-Z]\d+))?(?:<(\d+)>)?(?:\{([\w\-]+)\})?$/
  const fileMatch = fileNameAndRest.match(fileRegex)

  if (!fileMatch) {
    throw new Error('Invalid syntax. Ensure the input matches the expected format.')
  }

  // displayType
  // undefined 渲染 univer
  // html 渲染 HTML
  // chart-xx
  // chart-bar
  // chart-bar-racing
  // chart-line
  // chart-area
  // chart-pie
  // chart-ring-pie
  return {
    filePath,
    fileName: fileMatch[1],
    sheetName: fileMatch[2],
    startCell: fileMatch[3] || undefined, // Optional start cell
    endCell: fileMatch[4] || undefined, // Optional end cell
    height: fileMatch[5] ? Number.parseInt(fileMatch[5], 10) : undefined, // Optional height
    displayType: fileMatch[6] || undefined, // Optional display type
  }
}
