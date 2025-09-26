import type { TFile } from 'obsidian'
import type { IWorkbookData } from '@univerjs/core'
import { log } from '@ljcoder/smart-sheet/src/utils/log'
import type { ParsedHeader, ParsedMarkdown } from './type'

const outgoingLinksKey = 'outgoingLinks'

export class DataService {
  markdownData: ParsedMarkdown
  file: TFile

  constructor(file: TFile, fileData: string) {
    this.file = file
    this.markdownData = this.parseMarkdown(fileData)
  }

  getHeaderProperties(): Record<string, string> {
    return this.markdownData.header?.properties ?? {}
  }

  getHeaderProperty(key: string): string | undefined {
    return this.markdownData.header?.properties[key] ?? undefined
  }

  getHeader(): string {
    return this.markdownData.header?.raw
  }

  getBlocks(): Map<string, any> {
    return this.markdownData.blocks
  }

  getBlock<T>(type: string): T | undefined {
    return this.markdownData.blocks?.get(type) as T ?? undefined
  }

  getSheet(): IWorkbookData | undefined {
    return this.getBlock<IWorkbookData>('sheet')
  }

  getOutgoingLinks(): string[] {
    return this.getBlock<string[]>(outgoingLinksKey) ?? []
  }

  setOutgoingLinks(links: string[]) {
    this.setBlock(outgoingLinksKey, links)
  }

  updateOutgoingLink(newLink: string, oldLink: string) {
    const links = this.getOutgoingLinks()
    const newLinks = links.map((link) => {
      log('[dataService]', 'updateOutgoingLink', link, oldLink)
      if (link === `[[${oldLink}]]`) {
        return `[[${newLink}]]`
      }
      else {
        return link
      }
    })
    log('[dataService]', 'updateOutgoingLink', newLinks, links)
    this.setOutgoingLinks(newLinks)
  }

  /**
   * 获取 workbook 中所有 outgoing links
   * @returns 链接数组（去重）
   */
  getSheetOutgoingLinks(): string[] {
    const workbook = this.getSheet()
    if (!workbook) {
      return []
    }

    const links: Set<string> = new Set()

    if (!workbook.sheets) {
      return []
    }

    for (const sheetId of Object.keys(workbook.sheets)) {
      const sheet = workbook.sheets[sheetId]
      if (!sheet?.cellData)
        continue

      for (const rowKey of Object.keys(sheet.cellData)) {
        const row = sheet.cellData[rowKey]
        if (!row) {
          continue
        }

        for (const colKey of Object.keys(row)) {
          const cell = row[colKey]
          if (!cell?.p?.body?.customRanges) {
            continue
          }

          cell.p.body.customRanges.forEach((range: any) => {
            if (range.rangeType === 100 && range.properties?.url) {
              links.add(range.properties.url)
            }
          })
        }
      }
    }

    return Array.from(links)
  }

  /**
   * 遍历 workbook 所有 sheet，更新所有 rangeType == 100 的链接
   * @param workbook Univer workbook data
   * @param newLink 新的链接
   * @param oldLink 要替换的旧链接
   * @returns 更新后的 workbook（原地修改）
   */
  updateSheetOutgoingLinks(
    newLink: string,
    oldLink: string,
  ): IWorkbookData {
    const workbook = this.getSheet()
    if (!workbook) {
      return workbook
    }

    if (!workbook.sheets) {
      return workbook
    }

    for (const sheetId of Object.keys(workbook.sheets)) {
      const sheet = workbook.sheets[sheetId]
      if (!sheet?.cellData) {
        continue
      }

      for (const rowKey of Object.keys(sheet.cellData)) {
        const row = sheet.cellData[rowKey]
        if (!row) {
          continue
        }

        for (const colKey of Object.keys(row)) {
          const cell = row[colKey]
          if (!cell?.p?.body?.customRanges) {
            continue
          }

          cell.p.body.customRanges.forEach((range: any) => {
            if (range.rangeType === 100 && range.properties?.url === `[[${oldLink}]]`) {
              range.properties.url = `[[${newLink}]]`
              cell.p.body.dataStream = cell.p.body.dataStream?.replace(oldLink, newLink)
              cell.p.body.textRuns?.forEach((textRun: any) => {
                textRun.ed = newLink.length
              })
            }
          })
        }
      }
    }
  }

  setBlock(key: string, data: any) {
    this.markdownData.blocks?.set(key, data)
  }

  deleteBlock(key: string) {
    this.markdownData.blocks?.delete(key)
  }

  clear() {
    this.markdownData = {
      header: undefined,
      blocks: undefined,
    }
  }

  parseMarkdown(md: string, filePath?: string): ParsedMarkdown {
  // --- header ---
    const headerRegex = /^---\r?\n([\s\S]*?)\r?\n---\s*/
    const headerMatch = md.match(headerRegex)
    let header: ParsedHeader | undefined

    if (headerMatch) {
      const raw = `---\n${headerMatch[1]}\n---`
      const props: Record<string, string> = {}

      for (const line of headerMatch[1].split(/\r?\n/)) {
        const m = line.match(/^([^:]+):\s*(.*)$/)
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
    let match: RegExpExecArray | null

    while ((match = blockRegex.exec(restMd)) !== null) {
      const blockType = match[1].trim() || (isFirstBlock ? 'sheet' : 'default')
      isFirstBlock = false

      const jsonText = match[2].trim().replace(/[“”]/g, '"')

      try {
        const data = JSON.parse(jsonText)
        if (blockType === 'sheet' && data && typeof data === 'object' && filePath) {
          ;(data as Record<string, unknown>).name = filePath
        }
        blocks.set(blockType, data)
      }
      catch (e) {
      // 保留原始内容，避免丢失
        blocks.set(blockType, jsonText)
      }
    }

    // --- outgoingLinks ---
    const outgoingRegex = /###\s*outgoingLinks\s*\n([\s\S]*?)(?:\n%%|\n###|$)/
    const outgoingMatch = restMd.match(outgoingRegex)

    if (outgoingMatch) {
      const links = outgoingMatch[1]
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
      blocks.set('outgoingLinks', links)
    }

    return { header, blocks }
  }

  /**
   * 将 header + blocks 生成文件存储的字符串
   */
  stringifyMarkdown({ compact = true }: { compact?: boolean } = {}): string | null {
    const { header, blocks } = this.markdownData

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

    if (blocks && blocks.size > 0) {
      for (const [type, content] of blocks) {
        if (type === 'outgoingLinks' && Array.isArray(content)) {
        // 单独保存，最后输出
          outgoingLinksStr = `### outgoingLinks\n${content.join('\n')}\n\n`
        }
        else {
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
          blocksStr += `\`\`\`${type}\n${body}\n\`\`\`\n\n`
        }
      }
    }

    return `${headerStr}${blocksStr}${outgoingLinksStr}`.trimEnd()
  }
}
