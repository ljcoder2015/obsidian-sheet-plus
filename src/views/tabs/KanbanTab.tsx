import React from 'react'

export interface IKanbanColumn {
  id: string // 从 sheet 中获取的列 id，比如 A:A
  hidden: boolean
}

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string
  columns: IKanbanColumn[]
  order: string[]
}

export function KanbanTab() {
  return (
    <div>
      <h1>Kanban Tab</h1>
    </div>
  )
}
