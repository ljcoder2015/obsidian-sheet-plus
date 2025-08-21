import { createContext, useContext } from 'react'
import type { App } from 'obsidian'

// 创建App上下文
export const AppContext = createContext<App | undefined>(undefined)

// 创建自定义钩子，便于组件使用App上下文
export function useApp(): App | undefined {
  return useContext(AppContext)
}
