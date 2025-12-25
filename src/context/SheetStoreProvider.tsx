import { createContext, useEffect, useReducer, useContext } from 'react'
import type { SheetStoreAction, SheetStoreState } from '../services/reduce'
import { sheetStoreReducer } from '../services/reduce'
import { log } from 'console'

interface SheetStoreContextProps {
  state: SheetStoreState
  dispatch: React.Dispatch<SheetStoreAction>
}

const SheetStoreContext = createContext<SheetStoreContextProps | null>(null)

export function useSheetStore(): SheetStoreContextProps {
  const ctx = useContext(SheetStoreContext)
  if (!ctx) {
    throw new Error('SheetStoreProvider missing')
  }
  return ctx
}

export function SheetStoreProvider({
  initialState,
  children,
  onChange,
}: {
  initialState: SheetStoreState
  children: React.ReactNode
  onChange?: (state: SheetStoreState) => void
}) {
  const [state, dispatch] = useReducer(sheetStoreReducer, initialState)

  // 🔴 关键：监听 state 变化
  useEffect(() => {
    log('[SheetStoreProvider]', 'onChange', state)
    onChange?.(state)
  }, [state])

  return (
    <SheetStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </SheetStoreContext.Provider>
  )
}
