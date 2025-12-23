import type { ParsedHeader, ParsedMarkdown } from './type'
import { OUTGOING_LINKS_Key } from './type'

export function parseMarkdown(md: string, filePath?: string): ParsedMarkdown {
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

    // 直接取出代码块内容，不 trim，不替换
    const jsonText = match[2]

    try {
      const data = JSON.parse(jsonText)
      if (blockType === 'sheet' && data && typeof data === 'object' && filePath) {
        ;(data as Record<string, unknown>).name = filePath
      }
      blocks.set(blockType, data)
    }
    catch {
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
    blocks.set(OUTGOING_LINKS_Key, links)
  }

  return { header, blocks }
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

  if (blocks && blocks.size > 0) {
    for (const [type, content] of blocks) {
      if (type === OUTGOING_LINKS_Key && Array.isArray(content)) {
        // 单独保存，最后输出
        outgoingLinksStr = `### ${OUTGOING_LINKS_Key}\n${content.join('\n')}\n\n`
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
        // 用 String.raw 包装，避免 Obsidian 转义
        blocksStr += `\`\`\`${type}\n${String.raw`${body}`}\n\`\`\`\n\n`
      }
    }
  }

  return `${headerStr}${blocksStr}${outgoingLinksStr}`.trimEnd()
}
