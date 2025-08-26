import React from 'react'

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string
  hiddenColumns: string[]
  order: string[]
}

export function KanbanTab() {
  return (
    <div>
      <h1>Kanban Tab</h1>
    </div>
  )
}
