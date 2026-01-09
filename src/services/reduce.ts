import type { IWorkbookData } from '@univerjs/core'
import type { MultiSheet, ParsedHeader } from './type'

export interface SheetStoreState {
  header?: ParsedHeader

  // 唯一 Sheet（之前 table）
  sheet?: IWorkbookData

  // 其他视图
  views?: Map<string, any>

  // Tabs UI 状态（不是业务数据）
  tabs: MultiSheet

  outgoingLinks: string[]
}

export const SHEET_UPDATE_ACTION = 'SHEET_UPDATE'
export const VIEW_ADD_ACTION = 'VIEW_ADD'
export const VIEW_CONFIG_ADD_ACTION = 'VIEW_CONFIG_ADD'
export const VIEW_CONFIG_UPDATE_ACTION = 'VIEW_CONFIG_UPDATE'
export const VIEW_CONFIG_REMOVE_ACTION = 'VIEW_CONFIG_REMOVE'
export const VIEW_REMOVE_ACTION = 'VIEW_REMOVE'
export const VIEW_UPDATE_ACTION = 'VIEW_UPDATE'
export const TAB_DEFAULT_ACTION = 'TAB_DEFAULT_ACTIVE'
export const TAB_RENAME_ACTION = 'TAB_RENAME'
export const OUTGOING_LINKS_UPDATE_ACTION = 'OUTGOING_LINKS_UPDATE'

export type SheetStoreAction =
  | { type: 'SHEET_UPDATE', payload: IWorkbookData }
  | { type: 'VIEW_ADD', key: string, payload: any }
  | { type: 'VIEW_REMOVE', key: string }
  | { type: 'VIEW_UPDATE', key: string, payload: any }
  | { type: 'VIEW_CONFIG_ADD', key: string, payload: any }
  | { type: 'VIEW_CONFIG_UPDATE', key: string, payload: any }
  | { type: 'VIEW_CONFIG_REMOVE', key: string }
  | { type: 'TAB_DEFAULT_ACTIVE', key: string }
  | { type: 'TAB_RENAME', key: string, payload: string }
  | { type: 'OUTGOING_LINKS_UPDATE', payload: string[] }

export function sheetStoreReducer(
  state: SheetStoreState,
  action: SheetStoreAction,
): SheetStoreState {
  switch (action.type) {
    case 'SHEET_UPDATE':
      return { ...state, sheet: action.payload }

    case 'VIEW_ADD':
      return {
        ...state,
        tabs: {
          ...state.tabs,
          tabs: [...(state.tabs.tabs || []), action.payload],
        },
      }

    case 'VIEW_REMOVE': {
      const newViews = new Map(state.views || [])
      newViews.delete(action.key)
      return {
        ...state,
        views: newViews,
        tabs: {
          tabs: state.tabs.tabs?.filter(tab => tab.key !== action.key),
          defaultActiveKey: 'sheet',
        },
      }
    }

    case 'VIEW_UPDATE':
      return {
        ...state,
        tabs: { ...state.tabs, [action.key]: action.payload },
      }

    case 'VIEW_CONFIG_ADD': {
      const newViews = new Map(state.views || [])
      newViews.set(action.key, action.payload)
      return {
        ...state,
        views: newViews,
      }
    }

    case 'VIEW_CONFIG_UPDATE': {
      const newViews = new Map(state.views || [])
      newViews.set(action.key, action.payload)
      return {
        ...state,
        views: newViews,
      }
    }

    case 'VIEW_CONFIG_REMOVE': {
      const newViews = new Map(state.views || [])
      newViews.delete(action.key)
      return {
        ...state,
        views: newViews,
      }
    }

    case 'OUTGOING_LINKS_UPDATE':
      return { ...state, outgoingLinks: action.payload }

    case 'TAB_DEFAULT_ACTIVE': {
      return {
        ...state,
        tabs: { ...state.tabs, defaultActiveKey: action.key },
      }
    }

    case 'TAB_RENAME': {
      return {
        ...state,
        tabs: {
          ...state.tabs,
          tabs: state.tabs.tabs?.map(tab =>
            tab.key === action.key ? { ...tab, label: action.payload } : tab,
          ),
        },
      }
    }

    default:
      return state
  }
}
