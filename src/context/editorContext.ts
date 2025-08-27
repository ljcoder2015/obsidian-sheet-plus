import { createContext, useContext } from 'react'
import type { ExcelProView } from '../views/ExcelProView'

export const EditorContext = createContext<ExcelProView>(null)
export const useEditorContext = () => useContext<ExcelProView>(EditorContext)
