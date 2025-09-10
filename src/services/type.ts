export interface ParsedHeader {
  raw: string // 原始头部（包含 ---）
  properties: Record<string, string> // 属性键值对
}

export interface ParsedMarkdown {
  header?: ParsedHeader
  blocks?: Map<string, any>
}
