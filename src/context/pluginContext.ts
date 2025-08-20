import { createContext, useContext } from 'react'
import type { ExcelProView } from '../views/excelProView'

export const PluginContext = createContext<ExcelProView>(null)
export const usePluginContext = () => useContext<ExcelProView>(PluginContext)
