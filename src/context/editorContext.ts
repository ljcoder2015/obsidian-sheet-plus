import { createContext, useContext } from 'react'
import type { App } from 'obsidian'
import type { ExcelProView } from '../views/ExcelProView'

interface EditorContextProps {
  app: App
  editor: ExcelProView
  saveData: (data: unknown, key: string) => void
}

export const EditorContext = createContext<EditorContextProps>(null)
export const useEditorContext = () => useContext<EditorContextProps>(EditorContext)
