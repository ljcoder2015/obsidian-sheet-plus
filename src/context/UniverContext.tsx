import type { FUniver } from '@univerjs/core/facade'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { log } from '../utils/log'

interface UniverContextProps {
  univerApi: FUniver | null
  setUniverApi: (api: FUniver) => void
}

const UniverContext = createContext<UniverContextProps | null>(null)

export function UniverProvider({ children }: React.PropsWithChildren<object>) {
  const [univerApi, setUniverApi] = useState<any | null>(null)

  // 清理逻辑：组件卸载或 univerApi 更新时 dispose 旧实例
  useEffect(() => {
    return () => {
      if (univerApi) {
        try {
          log('[UniverProvider]', 'dispose univerApi')
          univerApi.dispose()
          setUniverApi(null)
        }
        catch (err) {
          console.error('Error disposing Univer instance:', err)
        }
      }
    }
  }, [univerApi])

  return (
    <UniverContext.Provider value={{ univerApi, setUniverApi }}>
      {children}
    </UniverContext.Provider>
  )
}

export function useUniver(): UniverContextProps {
  const ctx = useContext(UniverContext)
  if (!ctx)
    throw new Error('useUniver must be used inside UniverProvider')
  return ctx
}
