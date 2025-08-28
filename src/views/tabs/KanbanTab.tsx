import type { FUniver } from '@univerjs/core/facade'
import React, { useEffect } from 'react'

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string
  hiddenColumns: string[]
  order: string[]
}

interface IKanbanTabProps {
  data: IKanbanConfig
  univerApi: FUniver
  saveData: (data: any, key: string) => void
}

export function KanbanTab(props: IKanbanTabProps) {
  const { data, univerApi, saveData } = props
  const getData = () => {
    if (!univerApi) {
      return {}
    }
    const sheet = univerApi.getActiveWorkbook().getSheetBySheetId(data.sheetId)
    const values = sheet.getDataRange().getValues()
    if (!values) {
      return {}
    }

    return {
      sheetId: sheet.getSheetId(),
      groupColumn: 'A',
      hiddenColumns: [],
      order: [],
    }
  }

  useEffect(() => {
    getData()
  }, [univerApi])

  return (
    <div>
      <h1>Kanban Tab</h1>
    </div>
  )
}
