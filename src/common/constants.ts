export const VIEW_TYPE_EXCEL_PRO = 'excel-pro-view'
export const FRONTMATTER_KEY = 'excel-pro-plugin'
export const FRONTMATTER = ['---', '', `${FRONTMATTER_KEY}: parsed`, '', '---', '', ''].join('\n')
export const DEFAULT_CONTENT = ['```sheet', '```', '```multiSheet', '{"tabs":[{"key":"sheet","type":"sheet","label":"Sheet"}],"defaultActiveKey":"sheet"}', '```'].join('\n')

export enum TabType {
  SHEET = 'sheet',
  KANBAN = 'kanban',
  GROUP = 'group',
  BI = 'bi',
  PIVOT = 'pivot',
}

export interface TabItem {
  /** 对应 activeKey */
  key: string
  /** 选项卡头显示文字 */
  label: string
  /** 选项卡头显示图标，5.12.0 版本新增 */
  icon?: string

  type: TabType
}

export interface MultiSheet {
  tabs?: TabItem[]
  /** 默认 activeKey */
  defaultActiveKey?: string
}
