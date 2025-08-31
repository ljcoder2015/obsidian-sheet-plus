import type { FUniver } from '@univerjs/core/facade'
import React, { createContext, useContext, useState } from 'react'

interface UniverContextProps {
  univerApi: FUniver | null
  setUniverApi: (api: FUniver) => void
}

const UniverContext = createContext<UniverContextProps | null>(null)

export function UniverProvider({ children }: React.PropsWithChildren<object>) {
  const [univerApi, setUniverApi] = useState<any | null>(null)

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
