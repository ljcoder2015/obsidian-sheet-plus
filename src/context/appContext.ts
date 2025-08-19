// import { createContext, useContext } from 'react'
// import { App } from 'obsidian'

// // 创建App上下文
// export const AppContext = createContext<App | undefined>(undefined)

// // 创建App上下文提供者组件
// export const AppProvider = ({ app, children }: { app: App, children: React.ReactNode }) => {
//   return (
//     <AppContext.Provider value={app}>
//       {children}
//     </AppContext.Provider>
//   )
// }

// // 创建自定义钩子，便于组件使用App上下文
// export const useApp = (): App | undefined => {
//   return useContext(AppContext)
// }
