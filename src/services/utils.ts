import type { ICellData, IWorkbookData } from '@univerjs/core'
import { t } from '../lang/helpers'
import type { SheetStoreState } from './reduce'
import type { MultiSheet, ParsedHeader, ParsedMarkdown } from './type'
import { IMAGES_KEY, OUTGOING_LINKS_KEY, SHEET_KEY, TABS_KEY, TabType } from './type'

/** 浮动图在快照 resources 中的插件名（@univerjs/sheets-drawing 的 SHEET_DRAWING_PLUGIN 常量） */
const SHEET_DRAWING_PLUGIN = 'SHEET_DRAWING_PLUGIN'

export function parseMarkdown(md: string, filePath?: string): ParsedMarkdown {
  // --- header ---
  const headerRegex = /^---\r?\n([\s\S]*?)\r?\n---\s*/
  const headerMatch = md.match(headerRegex)
  let header: ParsedHeader | undefined

  if (headerMatch) {
    const raw = `---\n${headerMatch[1]}\n---`
    const props: Record<string, string> = {}

    for (const line of headerMatch[1].split(/\r?\n/)) {
      const m = line.match(/^([^:]+):(.*)$/)
      if (m)
        props[m[1].trim()] = m[2].trim()
    }

    header = { raw, properties: props }
  }

  const restMd = headerMatch ? md.slice(headerMatch[0].length) : md

  // --- blocks ---
  const blocks = new Map<string, unknown>()

  // --- code blocks ---
  const blockRegex = /```([^\n]*)\n([\s\S]*?)```/g
  let isFirstBlock = true
  let match = blockRegex.exec(restMd)

  while (match !== null) {
    const blockType = match[1].trim() || (isFirstBlock ? 'sheet' : 'default')
    isFirstBlock = false

    // 直接取出代码块内容，不 trim，不替换
    const jsonText = match[2]

    try {
      const data = JSON.parse(jsonText)
      if (blockType === 'sheet' && data && typeof data === 'object' && filePath) {
        (data as Record<string, unknown>).name = filePath
      }
      blocks.set(blockType, data)
    }
    catch {
      // 保留原始内容，避免丢失
      blocks.set(blockType, jsonText)
    }
    match = blockRegex.exec(restMd)
  }

  // --- outgoingLinks ---
  const outgoingRegex = /###[ \t]*outgoingLinks[ \t]*\r?\n([\s\S]*?)(?:\n%%|\n###|$)/
  const outgoingMatch = restMd.match(outgoingRegex)

  if (outgoingMatch) {
    const links = outgoingMatch[1]
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    blocks.set(OUTGOING_LINKS_KEY, links)
  }

  // --- images ---
  const imagesRegex = /###[ \t]*images[ \t]*\r?\n([\s\S]*?)(?:\n%%|\n###|$)/
  const imagesMatch = restMd.match(imagesRegex)

  if (imagesMatch) {
    const images = imagesMatch[1]
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    blocks.set(IMAGES_KEY, images)
  }

  return { header, blocks }
}

export function toStoreState(md: string, filePath?: string): SheetStoreState | undefined {
  const { header, blocks } = parseMarkdown(md, filePath)
  const views: Record<string, unknown> = {}
  blocks?.forEach((v, k) => {
    if (k !== SHEET_KEY && k !== TABS_KEY) {
      views[k] = v
    }
  })
  let sheet = blocks?.get(SHEET_KEY)
  if (!sheet || sheet === '\n') {
    sheet = {}
  }
  let tabs = blocks?.get(TABS_KEY) as MultiSheet
  if (!tabs) {
    tabs = {
      tabs: [{
        key: 'sheet',
        type: TabType.SHEET,
        label: t('TAB_TYPE_SHEET'),
      }],
      defaultActiveKey: 'sheet',
    }
  }
  return {
    header,
    sheet: sheet as IWorkbookData | undefined,
    views,
    tabs,
    outgoingLinks: blocks?.get(OUTGOING_LINKS_KEY) as string[],
    images: blocks?.get(IMAGES_KEY) as string[],
  }
}

export function toMarkdown(state: SheetStoreState): string | null {
  const blocks = new Map()
  blocks.set(SHEET_KEY, state.sheet)
  blocks.set(TABS_KEY, state.tabs)
  if (state.views) {
    for (const [k, v] of Object.entries(state.views)) {
      if (k !== SHEET_KEY && k !== TABS_KEY) {
        blocks.set(k, v)
      }
    }
  }
  // 空数组不写入，避免序列化成 ```outgoingLinks\n[] 代码块
  if (Array.isArray(state.outgoingLinks) && state.outgoingLinks.length > 0) {
    blocks.set(OUTGOING_LINKS_KEY, state.outgoingLinks)
  }
  // 图片引用区块：同样空数组不写入
  if (Array.isArray(state.images) && state.images.length > 0) {
    blocks.set(IMAGES_KEY, state.images)
  }
  return stringifyMarkdown({
    header: state.header,
    blocks,
    compact: true,
  })
}

/**
 * 将 header + blocks 生成文件存储的字符串
 */
export function stringifyMarkdown({ header, blocks, compact = true }: { header?: ParsedHeader, blocks?: Map<string, unknown>, compact?: boolean }): string | null {
  if (!header && (!blocks || blocks.size === 0)) {
    return null
  }

  // --- header ---
  let headerStr = ''
  if (header) {
    if (header.raw) {
      headerStr = `${header.raw}\n`
    }
    else if (header.properties && Object.keys(header.properties).length > 0) {
      const propsLines = Object.entries(header.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      headerStr = `---\n${propsLines}\n---\n`
    }
  }

  // --- blocks ---
  let blocksStr = ''
  let outgoingLinksStr = ''
  let imagesStr = ''

  if (blocks && blocks.size > 0) {
    for (const [type, content] of blocks) {
      if (type === OUTGOING_LINKS_KEY && Array.isArray(content) && content.length > 0) {
        // 单独保存，最后输出
        outgoingLinksStr = `### ${OUTGOING_LINKS_KEY}\n${content.join('\n')}\n\n`
      }
      else if (type === IMAGES_KEY && Array.isArray(content) && content.length > 0) {
        imagesStr = `### ${IMAGES_KEY}\n${content.join('\n')}\n\n`
      }
      else {
        // 防御：outgoingLinks / images 为空数组时不输出，避免生成空数组代码块
        if ((type === OUTGOING_LINKS_KEY || type === IMAGES_KEY) && Array.isArray(content) && content.length === 0) {
          continue
        }
        let body: string
        if (typeof content === 'string') {
          body = content
        }
        else {
          try {
            // compact=true → 压缩成一行；false → 格式化
            body = compact ? JSON.stringify(content) : JSON.stringify(content, null, 2)
          }
          catch {
            body = String(content)
          }
        }
        // 用 String.raw 包装，避免 Obsidian 转义
        blocksStr += `\`\`\`${type}\n${String.raw`${body}`}\n\`\`\`\n\n`
      }
    }
  }

  return `${headerStr}${blocksStr}${outgoingLinksStr}${imagesStr}`.trimEnd()
}

// 更新工作表中的 outgoingLinks
export function updateSheetOutgoingLinks(state: SheetStoreState, newLink: string, oldLink: string): SheetStoreState {
  const workbook = state.sheet
  if (!workbook) {
    return state
  }

  if (!workbook.sheets) {
    return state
  }

  for (const sheetId of Object.keys(workbook.sheets)) {
    const sheet = workbook.sheets[sheetId]
    if (!sheet?.cellData) {
      continue
    }

    // cellData 为稀疏矩阵（行号/列号为 key），行/列均按字符串 key 宽松访问
    const cellData = sheet.cellData as Record<string, Record<string, ICellData> | undefined>
    for (const rowKey of Object.keys(cellData)) {
      const row = cellData[rowKey]
      if (!row) {
        continue
      }

      for (const colKey of Object.keys(row)) {
        const cell = row[colKey]
        const body = cell.p?.body
        const customRanges = body?.customRanges
        if (!body || !customRanges) {
          continue
        }
        // 提前取出闭包引用，避免回调内重复窄化；properties 为超链接属性（如 { url }）
        customRanges.forEach((range) => {
          const props = range.properties
          if (range.rangeType !== 100 || !props || props.url !== `[[${oldLink}]]`) {
            return
          }
          props.url = `[[${newLink}]]`
          body.dataStream = body.dataStream.replace(oldLink, newLink)
          body.textRuns?.forEach((textRun) => {
            textRun.ed = newLink.length
          })
        })
      }
    }
  }

  return state
}

// 更新markdown文本 [[xxx]] 这样才能被 Obsidian 解析
export function updateOutgoingLink(state: SheetStoreState, newLink: string, oldLink: string): SheetStoreState {
  const links = state.outgoingLinks
  const newLinks = links.map((link) => {
    if (link === `[[${oldLink}]]`) {
      return `[[${newLink}]]`
    }
    else {
      return link
    }
  })
  return {
    ...state,
    outgoingLinks: newLinks,
  }
}

/**
 * 判断 source 是否指向 oldLink 对应的文件。
 * 兼容三种存储形式：[[linktext]]（可带目录/扩展名）、[[basename]]、旧版裸 vault 路径。
 */
function imageSourceMatches(source: unknown, oldLink: string): boolean {
  if (typeof source !== 'string' || !source) {
    return false
  }
  // 旧版数据：source 直接是完整 vault 路径
  if (source === oldLink) {
    return true
  }
  // 新版数据：[[linktext]]（linktext 相对当前表格文件，可能带目录）
  if (source === `[[${oldLink}]]`) {
    return true
  }
  const oldName = oldLink.split('/').pop() ?? oldLink
  if (source === `[[${oldName}]]`) {
    return true
  }
  const withoutExt = oldName.replace(/\.[^.]+$/, '')
  if (withoutExt && source === `[[${withoutExt}]]`) {
    return true
  }
  return false
}

/**
 * 更新快照中的图片 source（文件名重命名时调用）：
 * 1. 浮动图：resources 里 SHEET_DRAWING_PLUGIN 条目（data 为 JSON 字符串，运行时由
 *    sheetDrawingService 实时序列化，随 workbook.save() 一起返回）；
 * 2. 单元格内嵌图：cellData.p.drawings 中的 drawing.source。
 * 新值统一写为 [[newLink]]（相对当前表格文件的 linktext）。
 */
export function updateSheetImages(state: SheetStoreState, newLink: string, oldLink: string): SheetStoreState {
  const workbook = state.sheet
  if (!workbook) {
    return state
  }

  // 1. 浮动图
  if (Array.isArray(workbook.resources)) {
    for (const resource of workbook.resources) {
      if (!resource || resource.name !== SHEET_DRAWING_PLUGIN || typeof resource.data !== 'string') {
        continue
      }
      try {
        // 结构：{ [subUnitId]: { data: Record<drawingId, ISheetDrawing>, order: string[] } }
        const map = JSON.parse(resource.data) as Record<string, { data?: Record<string, Record<string, unknown>> }>
        let changed = false
        for (const subUnitMap of Object.values(map)) {
          const drawings = subUnitMap?.data
          if (!drawings) {
            continue
          }
          for (const drawing of Object.values(drawings)) {
            if (imageSourceMatches(drawing.source, oldLink)) {
              drawing.source = `[[${newLink}]]`
              changed = true
            }
          }
        }
        if (changed) {
          resource.data = JSON.stringify(map)
        }
      }
      catch {
        // 解析失败保持原样，避免损坏文件
      }
    }
  }

  // 2. 单元格内嵌图
  if (workbook.sheets) {
    for (const sheetId of Object.keys(workbook.sheets)) {
      const sheet = workbook.sheets[sheetId]
      if (!sheet?.cellData) {
        continue
      }
      const cellData = sheet.cellData as Record<string, Record<string, ICellData> | undefined>
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
            if (imageSourceMatches(drawing.source, oldLink)) {
              drawing.source = `[[${newLink}]]`
            }
          }
        }
      }
    }
  }

  return state
}

// 更新 markdown ### images 区块中的 [[xxx]]
export function updateImages(state: SheetStoreState, newLink: string, oldLink: string): SheetStoreState {
  const images = state.images ?? []
  const newImages = images.map(link => (imageSourceMatches(link, oldLink) ? `[[${newLink}]]` : link))
  return {
    ...state,
    images: newImages,
  }
}
