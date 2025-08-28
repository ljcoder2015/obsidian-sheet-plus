import type { FUniver } from '@univerjs/core/facade'
import React, { useEffect, useState } from 'react'
import type {
  DropResult,
} from '@hello-pangea/dnd'

import { DataValidationType } from '@univerjs/core'
import { log } from '../../utils/log'
import { t } from '../../lang/helpers'

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string // 用来分组的列（比如 "A"）
  hiddenColumns: string[]
  order: string[] // 分组的顺序
}

interface IKanbanTabProps {
  data: IKanbanConfig
  univerApi: FUniver
  saveData: (data: any, key: string) => void
}

interface IGroups {
  groups?: string[]
  header?: string[]
  grouped?: Record<string, Record<string, any>[]>
}

export function KanbanTab(props: IKanbanTabProps) {
  const { data, univerApi, saveData } = props
  const [columns, setColumns] = useState<IGroups>({})

  // 从 sheet 获取数据并分组
  const getData = () => {
    if (!univerApi)
      return {}
    const sheet = univerApi.getActiveWorkbook().getSheetBySheetId(data.sheetId)
    const range = sheet.getDataRange()
    const colIndex = Number.parseInt(data.groupColumn)
    const groupColumn = sheet.getRange(0, colIndex, range.getLastRow() - range.getRow())
    const validations = groupColumn.getDataValidations()
    let groups = [] // 分组选项列，读取数据验证的设置
    validations.forEach((item) => {
      const { rule } = item
      if (rule.type === DataValidationType.LIST) {
        groups = rule.formula1.split(',')
      }
    })

    const values = range.getDisplayValues()
    log('[KanbanTab]', 'getData', values)
    if (!values || values.length === 0)
      return {}
    const header = values[0] // 表头
    const grouped: Record<string, Record<string, any>[]> = {}
    groups.forEach((group) => {
      grouped[group] = []
    })
    grouped[t('KANBAN_NOT_GROUP')] = []
    values.slice(1).forEach((row) => {
      if (groups.includes(row[colIndex])) {
        const field = {}
        row.forEach((item, index) => {
          field[header[index]] = item
        })
        grouped[row[colIndex]].push(field)
      }
      else {
        const field = {}
        row.forEach((item, index) => {
          field[header[index]] = item
        })
        grouped[t('KANBAN_NOT_GROUP')].push(field)
      }
    })

    return {
      groups,
      header,
      grouped,
    }
  }

  useEffect(() => {
    const grouped: IGroups = getData()
    setColumns(grouped)
  }, [univerApi, data.sheetId, data.groupColumn])

  // 拖拽逻辑
  const handleDragEnd = (result: DropResult) => {
    // const { source, destination } = result
    // if (!destination)
    //   return

    // const sourceCol = Array.from(columns[source.droppableId])
    // const destCol = Array.from(columns[destination.droppableId])

    // // 同列
    // if (source.droppableId === destination.droppableId) {
    //   const [moved] = sourceCol.splice(source.index, 1)
    //   sourceCol.splice(destination.index, 0, moved)

    //   setColumns({
    //     ...columns,
    //     [source.droppableId]: sourceCol,
    //   })
    // }
    // else {
    //   // 跨列
    //   const [moved] = sourceCol.splice(source.index, 1)
    //   destCol.splice(destination.index, 0, moved)

    //   setColumns({
    //     ...columns,
    //     [source.droppableId]: sourceCol,
    //     [destination.droppableId]: destCol,
    //   })
    // }

    // // TODO: 同步更新到 sheet，这里只调用 saveData 占位
    // saveData(columns, 'kanban')
  }

  return (
    <div className="kanban flex flex-col border">
      {/* { columns.grouped
        ? (
            <DragDropContext
              onDragEnd={handleDragEnd}
              children={
                Object.entries<Record<string, Array<Record<string, any>>>>(columns.grouped || {})?.map((colId) => {
                  return (
                    <Droppable
                      droppableId={colId}
                      children={
                        columns.grouped[colId]?.map((task, index) => (
                          <Draggable
                            draggableId={`${colId}-${index}`}
                            index={index}
                            children={
                              (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubic: DraggableRubric) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white rounded shadow p-2 mb-2"
                                >
                                  {JSON.stringify(task)}
                                </div>
                              )
                            }
                          />
                        ))
                      }
                    />
                  )
                })
              }
            />
          )
        : <div>空数据</div>} */}
    </div>
  )
}
