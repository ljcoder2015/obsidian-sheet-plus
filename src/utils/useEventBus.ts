// useEventBus.ts
import { useEffect } from 'react'
import type { AppEvents } from './eventBus'
import emitter from './eventBus'

/**
 * 监听事件（自动清理）
 */
export function useEventBus<K extends keyof AppEvents>(
  event: K,
  handler: (payload: AppEvents[K]) => void,
) {
  useEffect(() => {
    emitter.on(event, handler)
    return () => {
      emitter.off(event, handler)
    }
  }, [event, handler])
}

/**
 * 触发事件
 * - 有参数的事件必须传参
 * - void 类型的事件可以不传参
 */
export function emitEvent<K extends keyof AppEvents>(
  event: K,
  ...payload: AppEvents[K] extends void ? [] : [AppEvents[K]]
) {
  // 这里要断言一下，因为 TS 不知道 payload 是否为空
  emitter.emit(event, ...(payload as [AppEvents[K]]))
}
