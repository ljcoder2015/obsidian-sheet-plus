import type { TFile } from 'obsidian'
import type { IWorkbookData } from '@univerjs/core'
import type { ParsedHeader, ParsedMarkdown } from './type'

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
    return this.getBlock<string[]>('outgoingLinks') ?? []
  }

  setOutgoingLinks(links: string[]) {
    this.setBlock('outgoingLinks', links)
  }

  // 获取表格 OutgoingLink 插件的数据
  updateSheetOutgoingLInks(newLink: string, oldLink: string) {
    const sheet = this.getSheet()
    const pluginData = sheet.resources.filter(r => r.id === 'SHEET_OUTGOINGLINKS_PLUGIN').map(r => JSON.parse(r.data))
    
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
    // 匹配头部（--- 开头到 --- 结束，支持多行）
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const headerMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*/)
    let header: ParsedHeader | undefined

    if (headerMatch) {
      const raw = `---\n${headerMatch[1]}\n---`
      const props: Record<string, string> = {}

      headerMatch[1].split('\n').forEach((line) => {
      // eslint-disable-next-line regexp/no-super-linear-backtracking
        const m = line.match(/^([^:]+):\s*(.*)$/)
        if (m) {
          props[m[1].trim()] = m[2].trim()
        }
      })

      header = { raw, properties: props }
    }

    const restMd = headerMatch ? md.slice(headerMatch[0].length) : md

    const blockRegex = /```([^\n]*)\n([\s\S]*?)```/g
    const blocks = new Map<string, any>()
    let isFirstBlock = true

    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = blockRegex.exec(restMd)) !== null) {
      let blockType = match[1].trim()
      if (!blockType)
        blockType = isFirstBlock ? 'sheet' : 'default'
      isFirstBlock = false

      const rawText = match[2].trim().replace(/[“”]/g, '"')

      try {
        const data = JSON.parse(rawText)
        if (blockType === 'sheet' && data) {
          data.name = this.file.path
        }
        blocks.set(blockType, data)
      }
      catch {
        blocks.set(blockType, rawText)
      }
    }

    /**
     * 2. 解析 ### outgoingLinks 格式
     */
    const outgoingRegex = /^###\s*outgoingLinks\s*\n([\s\S]*?)(?=\n###|\n?$)/m
    const outgoingMatch = restMd.match(outgoingRegex)
    if (outgoingMatch) {
      const rawText = outgoingMatch[1].trim()
      const links: string[] = rawText.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
      blocks.set('outgoingLinks', links)
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
          blocksStr += `### outgoingLinks\n${text}\n`
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
