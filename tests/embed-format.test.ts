import { describe, expect, it } from 'vitest'
import { findEmbedLinks, formatPresets, lineBounds, nearestRange, pickEmbedLink, presetPreview, withFormat } from '../src/post-processor/embed-format'
import { formatValue } from '../src/post-processor/formula-render'

const SRC = '🏡 Remaining Rent/data.md#Sheet 1'

describe('withFormat', () => {
  it('adds a format', () => {
    expect(withFormat(`![[${SRC}|=SUM(F9:F20)]]`, '$#,##0.00')).toBe(`![[${SRC}|=SUM(F9:F20){fmt:$#,##0.00}]]`)
  })

  it('replaces an existing format', () => {
    expect(withFormat(`![[${SRC}|=SUM(F9:F20){fmt:0%}]]`, '#,##0')).toBe(`![[${SRC}|=SUM(F9:F20){fmt:#,##0}]]`)
  })

  it('removes the format', () => {
    expect(withFormat(`![[${SRC}|=SUM(F9:F20){fmt:0%}]]`, undefined)).toBe(`![[${SRC}|=SUM(F9:F20)]]`)
  })

  it('keeps the escaped pipe used inside tables', () => {
    expect(withFormat(`![[${SRC}\\|={1,2}]]`, '0%')).toBe(`![[${SRC}\\|={1,2}{fmt:0%}]]`)
  })
})

describe('findEmbedLinks', () => {
  const text = `Total: ![[${SRC}|=SUM(F9:F20)]] and again ![[${SRC}|=SUM(F9:F20)]]\n| ![[${SRC}\\|=SUM(F9:F20)]] |`

  it('finds every copy of the link, including the table form', () => {
    const ranges = findEmbedLinks(text, SRC, '=SUM(F9:F20)')
    expect(ranges).toHaveLength(3)
    for (const { from, to } of ranges)
      expect(text.slice(from, to)).toMatch(/^!\[\[.*\]\]$/)
  })

  it('only searches inside the given range', () => {
    const firstLine = text.indexOf('\n')
    expect(findEmbedLinks(text, SRC, '=SUM(F9:F20)', 0, firstLine)).toHaveLength(2)
  })

  it('does not match a different formula', () => {
    expect(findEmbedLinks(text, SRC, '=SUM(F9:F10)')).toHaveLength(0)
  })
})

describe('nearestRange', () => {
  const ranges = [{ from: 10, to: 20 }, { from: 40, to: 50 }]

  it('picks the range containing the position', () => {
    expect(nearestRange(ranges, 45)).toEqual({ from: 40, to: 50 })
  })

  it('picks the closest range otherwise', () => {
    expect(nearestRange(ranges, 24)).toEqual({ from: 10, to: 20 })
    expect(nearestRange(ranges, 36)).toEqual({ from: 40, to: 50 })
  })

  it('returns undefined when there is nothing to pick', () => {
    expect(nearestRange([], 5)).toBeUndefined()
  })
})

describe('pickEmbedLink', () => {
  const ranges = [{ from: 10, to: 20 }, { from: 40, to: 50 }]

  it('picks the link at the clicked position', () => {
    expect(pickEmbedLink(ranges, 40)).toEqual({ from: 40, to: 50 })
  })

  it('takes the only link when the position is unknown', () => {
    expect(pickEmbedLink([ranges[1]], undefined)).toEqual({ from: 40, to: 50 })
  })

  it('refuses to guess between identical links when the position is unknown', () => {
    expect(pickEmbedLink(ranges, undefined)).toBeUndefined()
  })
})

describe('lineBounds', () => {
  it('returns the offsets of the given line', () => {
    const text = 'one\ntwo\nthree'
    const { from, to } = lineBounds(text, 1)
    expect(text.slice(from, to)).toBe('two')
  })

  it('runs to the end of the text on the last line', () => {
    const text = 'one\ntwo'
    const { from, to } = lineBounds(text, 1)
    expect(text.slice(from, to)).toBe('two')
  })
})

describe('formatPresets', () => {
  const presets = formatPresets('$')
  const pattern = (key: string) => presets.find(p => p !== 'separator' && p.key === key)
  const sample = (key: string) => {
    const preset = pattern(key)
    return preset && preset !== 'separator' ? formatValue(1220, preset.pattern ?? undefined).trim() : undefined
  }

  it('mirrors the sheet\'s number format menu, in order', () => {
    expect(presets.map(p => p === 'separator' ? '|' : p.key)).toEqual([
      'FORMULA_FORMAT_GENERAL',
      'FORMULA_FORMAT_TEXT',
      '|',
      'FORMULA_FORMAT_NUMBER',
      'FORMULA_FORMAT_PERCENT',
      'FORMULA_FORMAT_SCIENTIFIC',
      '|',
      'FORMULA_FORMAT_ACCOUNTING',
      'FORMULA_FORMAT_FINANCIAL',
      'FORMULA_FORMAT_CURRENCY',
      'FORMULA_FORMAT_ROUNDING_CURRENCY',
      '|',
      'FORMULA_FORMAT_DATE',
      'FORMULA_FORMAT_TIME',
      'FORMULA_FORMAT_DATE_TIME',
      'FORMULA_FORMAT_DURATION',
    ])
  })

  it('formats a value the way the sheet\'s menu previews it', () => {
    expect(sample('FORMULA_FORMAT_GENERAL')).toBe('1220')
    expect(sample('FORMULA_FORMAT_NUMBER')).toBe('1220')
    expect(sample('FORMULA_FORMAT_PERCENT')).toBe('122000.00%')
    expect(sample('FORMULA_FORMAT_SCIENTIFIC')).toBe('1.22E+03')
    expect(sample('FORMULA_FORMAT_ACCOUNTING')).toBe('$ 1,220.00')
    expect(sample('FORMULA_FORMAT_FINANCIAL')).toBe('1,220.00')
    expect(sample('FORMULA_FORMAT_CURRENCY')).toBe('$1,220.00')
    expect(sample('FORMULA_FORMAT_ROUNDING_CURRENCY')).toBe('$1,220')
    expect(sample('FORMULA_FORMAT_DATE')).toBe('1903-05-04')
  })

  it('uses the given currency symbol', () => {
    expect(pattern('FORMULA_FORMAT_CURRENCY')).toMatchObject({ pattern: expect.stringContaining('"$"') })
    expect(formatPresets('€').find(p => p !== 'separator' && p.key === 'FORMULA_FORMAT_CURRENCY')).toMatchObject({ pattern: expect.stringContaining('"€"') })
  })

  it('keeps ]] out of every pattern, so the link stays intact', () => {
    for (const preset of presets) {
      if (preset !== 'separator')
        expect(preset.pattern ?? '').not.toContain(']]')
    }
  })
})

describe('presetPreview', () => {
  it('previews the same sample value as the sheet\'s menu', () => {
    expect(presetPreview('"$"#,##0.00_);("$"#,##0.00)')).toBe('$1,220.00')
  })

  it('shows nothing for General', () => {
    expect(presetPreview(null)).toBeUndefined()
  })
})
