/**
 * Embed link parsing for `![[file#Sheet|alt]]`.
 *
 * Obsidian hands the post-processor `src` (`file#Sheet`) and `alt` (everything after `|`)
 * separately. They are parsed separately here, and never re-joined or split on `/`, so file
 * paths, formulas and number formats can contain any character.
 */

export interface RangeEmbed {
  kind: 'range'
  fileName: string
  sheetName?: string
  startCell?: string
  endCell?: string
  height?: number
  displayType?: string
}

export interface FormulaEmbed {
  kind: 'formula'
  fileName: string
  sheetName?: string
  formula: string
  format?: string
}

export type ParsedEmbed = RangeEmbed | FormulaEmbed

// A1:B2 (any column width, any case), then optional <height>, then optional {displayType}
const RANGE_ALT = /^(?:([A-Z]+\d+):([A-Z]+\d+))?(?:<(\d+)>)?(?:\{([\w-]+)\})?$/i

const FORMAT_PREFIX = '{fmt:'

export function parseEmbedLink(src: string, alt: string): ParsedEmbed {
  const hashIndex = src.indexOf('#')
  const fileName = hashIndex === -1 ? src : src.slice(0, hashIndex)
  const sheetName = hashIndex === -1 ? undefined : src.slice(hashIndex + 1) || undefined
  const trimmed = alt.trim()

  if (trimmed.startsWith('='))
    return { kind: 'formula', fileName, sheetName, ...splitFormat(trimmed) }

  const match = trimmed.match(RANGE_ALT)
  if (!match)
    return { kind: 'range', fileName, sheetName }

  return {
    kind: 'range',
    fileName,
    sheetName,
    startCell: match[1]?.toUpperCase(),
    endCell: match[2]?.toUpperCase(),
    height: match[3] ? Number.parseInt(match[3], 10) : undefined,
    displayType: match[4],
  }
}

/** Only a trailing `{fmt:…}` is a suffix; any other `{…}` belongs to the formula. */
export function splitFormat(alt: string): { formula: string, format?: string } {
  const start = alt.lastIndexOf(FORMAT_PREFIX)
  if (start === -1 || !alt.endsWith('}'))
    return { formula: alt }

  const format = alt.slice(start + FORMAT_PREFIX.length, -1)
  return { formula: alt.slice(0, start).trimEnd(), format: format || undefined }
}
