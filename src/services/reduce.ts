import type { IWorkbookData } from '@univerjs/core'
import type { MultiSheet, ParsedHeader } from './type'

export interface SheetStoreState {
  header?: ParsedHeader

  // 唯一 Sheet（之前 table）
  sheet: IWorkbookData

  // 其他视图
  views: Record<string, any> | undefined

  // Tabs UI 状态（不是业务数据）
  tabs: MultiSheet

  outgoingLinks: string[]
}

export const SHEET_UPDATE_ACTION = 'SHEET_UPDATE'
export const VIEW_ADD_ACTION = 'VIEW_ADD'
export const VIEW_REMOVE_ACTION = 'VIEW_REMOVE'
export const VIEW_UPDATE_ACTION = 'VIEW_UPDATE'
export const TAB_ACTIVE_ACTION = 'TAB_ACTIVE'

export type SheetStoreAction =
  | { type: 'SHEET_UPDATE', payload: IWorkbookData }
  | { type: 'VIEW_ADD', key: string, payload: any }
  | { type: 'VIEW_REMOVE', key: string }
  | { type: 'VIEW_UPDATE', key: string, payload: Partial<any> }
  | { type: 'TAB_ACTIVE', key: string }

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
        views: {
          ...state.views,
          [action.key]: action.payload,
        },
        tabs: {
          ...state.tabs,
          defaultActiveKey: action.payload.id,
        },
      }

    case 'VIEW_REMOVE': {
      const { [action.key]: _, ...rest } = state.views
      return {
        ...state,
        views: rest,
        tabs: {
          ...state.tabs,
          defaultActiveKey: 'sheet',
        },
      }
    }

    case 'TAB_ACTIVE':
      return {
        ...state,
        tabs: { ...state.tabs, defaultActiveKey: action.key },
      }

    default:
      return state
  }
}
