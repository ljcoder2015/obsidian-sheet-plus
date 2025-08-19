export const VIEW_TYPE_EXCEL_PRO = 'excel-pro-view'
export const FRONTMATTER_KEY = 'excel-pro-plugin'
export const FRONTMATTER = ['---', '', `${FRONTMATTER_KEY}: parsed`, '', '---', '', ''].join('\n')

export enum TabType {
  SHEET = 'sheet',
  KANBAN = 'kanban',
  GROUP = 'group',
  BI = 'bi',
  PIVOT = 'pivot',
}
