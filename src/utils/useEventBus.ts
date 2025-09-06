// useEventBus.ts
import { useEffect, useRef } from 'react'
import type { AppEvents } from './eventBus'
import emitter, { clearAllEvents } from './eventBus'
import { log } from './log'

/**
 * 监听事件（自动清理）
 */
export function useEventBus<K extends keyof AppEvents>(
  event: K,
  handler: (payload: AppEvents[K]) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const wrapped = (payload: AppEvents[K]) => handlerRef.current(payload)
    emitter.on(event, wrapped)

    return () => {
      emitter.off(event, wrapped)
    }
  }, [event])
}

/**
 * 触发事件
 */
export function emitEvent<K extends keyof AppEvents>(
  event: K,
  ...payload: AppEvents[K] extends void ? [] : [AppEvents[K]]
) {
  emitter.emit(event, ...(payload as [AppEvents[K]]))
}

/**
 * 在组件卸载时清理所有事件
 */
export function useClearEvents() {
  useEffect(() => {
    return () => {
      clearAllEvents()
      log('[useClearEvents]', '清理所有事件')
    }
  }, [])
}
