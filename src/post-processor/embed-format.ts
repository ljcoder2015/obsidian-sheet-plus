/**
 * Text edits behind the formula embed's right-click format menu. The menu rewrites the
 * `{fmt:…}` suffix of one `![[src|alt]]` link in the note's source.
 */
import { splitFormat } from './embed-syntax'
import { formatValue } from './formula-render'

export interface TextRange {
  from: number
  to: number
}

export type FormatPreset = { key: string, pattern: string | null } | 'separator'

/**
 * The sheet's own number format menu (Univer's sheets-numfmt-ui), in its order. `key` is the
 * locale string for the label; a null pattern clears the format. Negative sections that only
 * turned the number red are left out: the embed is plain text, so the colour could not show.
 */
export function formatPresets(currencySymbol: string): FormatPreset[] {
  const c = `"${currencySymbol}"`
  return [
    { key: 'FORMULA_FORMAT_GENERAL', pattern: null },
    { key: 'FORMULA_FORMAT_TEXT', pattern: '@' },
    'separator',
    { key: 'FORMULA_FORMAT_NUMBER', pattern: '0' },
    { key: 'FORMULA_FORMAT_PERCENT', pattern: '0.00%' },
    { key: 'FORMULA_FORMAT_SCIENTIFIC', pattern: '0.00E+00' },
    'separator',
    { key: 'FORMULA_FORMAT_ACCOUNTING', pattern: `${c} #,##0.00_);(${c}#,##0.00)` },
    { key: 'FORMULA_FORMAT_FINANCIAL', pattern: '#,##0.00' },
    { key: 'FORMULA_FORMAT_CURRENCY', pattern: `${c}#,##0.00_);(${c}#,##0.00)` },
    { key: 'FORMULA_FORMAT_ROUNDING_CURRENCY', pattern: `${c}#,##0` },
    'separator',
    { key: 'FORMULA_FORMAT_DATE', pattern: 'yyyy-mm-dd;@' },
    { key: 'FORMULA_FORMAT_TIME', pattern: 'am/pm h":"mm":"ss' },
    { key: 'FORMULA_FORMAT_DATE_TIME', pattern: 'yyyy-m-d am/pm h:mm' },
    { key: 'FORMULA_FORMAT_DURATION', pattern: '[h]:mm:ss' },
  ]
}

// the sample number the sheet's menu formats for its previews
const PREVIEW_VALUE = 1220

/** The sample value in `pattern`, as the sheet's menu previews it; none for General. */
export function presetPreview(pattern: string | null): string | undefined {
  return pattern === null ? undefined : formatValue(PREVIEW_VALUE, pattern).trim()
}

// inside a table cell the alias pipe is written `\|`
const SEPARATORS = ['|', '\\|']

/** Every `![[src|alt]]` within text[from, to), in order. */
export function findEmbedLinks(text: string, src: string, alt: string, from = 0, to = text.length): TextRange[] {
  const ranges: TextRange[] = []
  for (const separator of SEPARATORS) {
    const link = `![[${src}${separator}${alt}]]`
    let index = text.indexOf(link, from)
    while (index !== -1 && index + link.length <= to) {
      ranges.push({ from: index, to: index + link.length })
      index = text.indexOf(link, index + link.length)
    }
  }
  return ranges.sort((a, b) => a.from - b.from)
}

/** The range containing `pos`, otherwise the one closest to it. */
export function nearestRange(ranges: TextRange[], pos: number): TextRange | undefined {
  const distance = (range: TextRange) => pos < range.from ? range.from - pos : Math.max(0, pos - range.to)
  return ranges.reduce<TextRange | undefined>(
    (best, range) => best === undefined || distance(range) < distance(best) ? range : best,
    undefined,
  )
}

/**
 * The link to edit: the one at `pos`, or the only one. With identical links and no position
 * there is no telling which was clicked, so none is picked rather than the wrong one.
 */
export function pickEmbedLink(ranges: TextRange[], pos: number | undefined): TextRange | undefined {
  if (pos === undefined)
    return ranges.length === 1 ? ranges[0] : undefined
  return nearestRange(ranges, pos)
}

/** The link with its `{fmt:…}` suffix set to `format`, or removed when `format` is undefined. */
export function withFormat(link: string, format: string | undefined): string {
  const inner = link.slice(3, -2)
  const pipe = inner.indexOf('|')
  const escaped = pipe > 0 && inner[pipe - 1] === '\\'
  const src = inner.slice(0, escaped ? pipe - 1 : pipe)
  const { formula } = splitFormat(inner.slice(pipe + 1).trim())
  const alt = format ? `${formula}{fmt:${format}}` : formula
  return `![[${src}${escaped ? '\\|' : '|'}${alt}]]`
}

/** Offsets covering line `line` (0-based), without its newline. */
export function lineBounds(text: string, line: number): TextRange {
  const lines = text.split('\n')
  let from = 0
  for (let i = 0; i < line; i++)
    from += (lines[i]?.length ?? 0) + 1

  from = Math.min(from, text.length)
  return { from, to: Math.min(from + (lines[line]?.length ?? 0), text.length) }
}
