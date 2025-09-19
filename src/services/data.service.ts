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

  parseMarkdown(md: string): ParsedMarkdown {
    // --- 1. 解析 header ---
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const headerMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*/)
    let header: ParsedHeader | undefined

    if (headerMatch) {
      const raw = `---\n${headerMatch[1]}\n---`
      const props: Record<string, string> = {}

      headerMatch[1].split('\n').forEach((line) => {
        // eslint-disable-next-line regexp/no-super-linear-backtracking
        const m = line.match(/^([^:]+):\s*(.*)$/)
        if (m)
          props[m[1].trim()] = m[2].trim()
      })

      header = { raw, properties: props }
      md = md.slice(headerMatch[0].length)
    }

    const blocks = new Map<string, any>()
    let isFirstBlock = true
    let i = 0
    const len = md.length

    while (i < len) {
    // --- 2. code block 解析 ```
      if (md.startsWith('```', i)) {
        const lineEnd = md.indexOf('\n', i + 3)
        const infoStringEnd = lineEnd === -1 ? len : lineEnd
        const blockType = md.slice(i + 3, infoStringEnd).trim()
        const closeIdx = md.indexOf('\n```', infoStringEnd + 1)
        let content: string
        if (closeIdx === -1) {
          content = md.slice(infoStringEnd + 1)
          i = len
        }
        else {
          content = md.slice(infoStringEnd + 1, closeIdx)
          i = closeIdx + 4
        }

        const rawText = content.replace(/[“”]/g, '"').trim()
        try {
          const data = JSON.parse(rawText)
          if (!blockType) {
            blocks.set(isFirstBlock ? 'sheet' : 'default', data)
          }
          else {
            if (blockType === 'sheet' && data)
              data.name = this.file.path
            blocks.set(blockType, data)
          }
        }
        catch {
          blocks.set(blockType || 'default', rawText)
        }

        isFirstBlock = false
        if (md[i] === '\n')
          i++
        continue
      }

      // --- 3. heading 解析，包括 outgoingLinks ---
      if (md.startsWith('###', i)) {
        const lineEnd = md.indexOf('\n', i)
        const headingName = lineEnd === -1 ? md.slice(i + 3).trim() : md.slice(i + 3, lineEnd).trim()
        const bodyStart = lineEnd === -1 ? len : lineEnd + 1
        let bodyEnd = len

        if (headingName === 'outgoingLinks') {
        // 找到 %% 作为结束符
          const pctIdx = md.indexOf('\n%%', bodyStart)
          if (pctIdx !== -1) {
            bodyEnd = pctIdx
            i = pctIdx + 3
          }
          else {
          // 没有 %%，到下一个 ### 或文件末尾
            const nextHeading = md.indexOf('\n###', bodyStart)
            bodyEnd = nextHeading === -1 ? len : nextHeading + 1
            i = bodyEnd
          }

          const body = md.slice(bodyStart, bodyEnd).trim()
          const links = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
          blocks.set('outgoingLinks', links)
          if (md[i] === '\n')
            i++
          continue
        }
        else {
        // 普通 heading
          const nextHeading = md.indexOf('\n###', bodyStart)
          bodyEnd = nextHeading === -1 ? len : nextHeading + 1
          const body = md.slice(bodyStart, bodyEnd).trim()
          blocks.set(headingName, body)
          i = bodyEnd
          if (md[i] === '\n')
            i++
          continue
        }
      }

      // --- 4. 非特殊行，逐行推进 ---
      const nextLine = md.indexOf('\n', i)
      if (nextLine === -1)
        break
      i = nextLine + 1
    }

    return { header, blocks }
  }

  /**
   * 将 header + blocks 生成文件存储的字符串
   */
  stringifyMarkdown(): string | null {
    const { header, blocks } = this.markdownData

    if (!header && !blocks) {
      return null
    }

    let headerStr = ''
    if (header?.properties && Object.keys(header.properties).length > 0) {
      const propsLines = Object.entries(header.properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      headerStr = `---\n${propsLines}\n---\n`
    }

    let blocksStr = ''
    if (blocks) {
      for (const [type, content] of blocks) {
        if (type === 'outgoingLinks' && Array.isArray(content)) {
          // heading 格式保存
          const text = content.join('\n')
          blocksStr += `### outgoingLinks\n${text}\n%%\n`
        }
        else if (typeof content === 'string') {
          // 普通文本 block
          blocksStr += `\`\`\`${type}\n${content}\n\`\`\`\n`
        }
        else {
          // JSON block
          blocksStr += `\`\`\`${type}\n${JSON.stringify(content)}\n\`\`\`\n`
        }
      }
    }

    return `${headerStr}${blocksStr}`
  }
}
