// eventBus.ts
import EventEmitter from 'eventemitter3'

export interface TabChangeProps {
  sheetId: string
  rowIndex: number
  colIndex: number
  value: string
}

export interface SaveDataProps {
  key: string
}

// 定义所有事件类型
export interface AppEvents {
  sheetChange: void
  tabChange: TabChangeProps
  saveData: SaveDataProps
}

// 实例
const emitter = new EventEmitter<AppEvents>()

// 工具函数
export function clearAllEvents() {
  emitter.removeAllListeners()
}

export default emitter
