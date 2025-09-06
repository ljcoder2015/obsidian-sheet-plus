// eventBus.ts
import EventEmitter from 'eventemitter3'

// 定义所有事件类型
export interface AppEvents {
  sheetChange: void
}

// 实例
const emitter = new EventEmitter<AppEvents>()

// 工具函数
export function clearAllEvents() {
  emitter.removeAllListeners()
}

export default emitter
