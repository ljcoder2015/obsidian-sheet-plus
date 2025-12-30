export const VIEW_TYPE_EXCEL_PRO = 'excel-pro-view'
export const FRONTMATTER_KEY = 'excel-pro-plugin'
export const FRONTMATTER = ['---', '', `${FRONTMATTER_KEY}: parsed`, '', '---', '', ''].join('\n')
export const DEFAULT_CONTENT = ['```sheet', '{}', '```', '```multiSheet', '{"tabs":[{"key":"sheet","type":"sheet","label":"Sheet"}],"defaultActiveKey":"sheet"}', '```'].join('\n')
export const BLANK_CONTENT = `${FRONTMATTER}\n${DEFAULT_CONTENT}`
