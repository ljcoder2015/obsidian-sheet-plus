export interface ParsedSyntax {
  filePath?: string
  fileName: string
  sheetName: string
  startCell?: string // Optional start cell
  endCell?: string // Optional end cell; absent for a single cell
  height?: number // Optional height
  displayType?: string // Optional display type
}

export function parseEmbedLinkSyntax(input: string): ParsedSyntax {
  // 首先分离路径和文件名及其后的语法部分
  const pathParts = input.split('/')
  const filePath = pathParts.slice(0, -1).join('/')
  const fileNameAndRest = pathParts[pathParts.length - 1]

  // 正则表达式，支持所有 Unicode 字符（包括特殊字符、中文、俄文、泰文等）
  // eslint-disable-next-line regexp/no-super-linear-backtracking -- regex parses well-formed file references, not arbitrary input
  const fileRegex = /^(.+?)(?:#(.+?))?(?:\|([A-Z]\d+)(?::([A-Z]\d+))?)?(?:<(\d+)>)?(?:\{([\w-]+)\})?$/

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
