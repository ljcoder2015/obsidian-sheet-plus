import type { ParsedHeader, ParsedMarkdown } from './type'

export class DataService {
  markdownData: ParsedMarkdown

  constructor(fileData: string) {
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

  setBlock(key: string, data: any) {
    this.markdownData.blocks?.set(key, data)
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

      const jsonText = match[2].trim().replace(/[“”]/g, '"')
      try {
        blocks.set(blockType, JSON.parse(jsonText))
      }
      catch {
        blocks.set(blockType, jsonText)
      }
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
        blocksStr += `\`\`\`${type}\n${JSON.stringify(content)}\n\`\`\`\n`
      }
    }

    return `${headerStr}${blocksStr}`
  }
}
