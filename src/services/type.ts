import type { IWorkbookData } from '@univerjs/core'

export const OUTGOING_LINKS_KEY = 'outgoingLinks'
export const TABS_KEY = 'multiSheet'
export const SHEET_KEY = 'sheet'

export interface ParsedHeader {
  raw: string // 原始头部（包含 ---）
  properties: Record<string, string> // 属性键值对
}

export interface ParsedMarkdown {
  header?: ParsedHeader
  blocks?: Map<string, any>
}

export type StoreEventSource =
  | 'sheet'
  | 'kanban'
  | 'history'
  | 'system'
  | 'tabs'

export type StoreEvent =
  | { type: 'workbook:update', workbook: IWorkbookData, source: StoreEventSource }
  | { type: 'kanban:update', row: number, col: number, value: any, source: StoreEventSource }
  | { type: 'link:add', link: string, source: StoreEventSource }
  | { type: 'hydrate', source: StoreEventSource }
  | { type: 'tabs:update', tabs: MultiSheet, source: StoreEventSource }

export enum TabType {
  SHEET = 'sheet',
  KANBAN = 'kanban',
  CALENDAR = 'calendar',
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
