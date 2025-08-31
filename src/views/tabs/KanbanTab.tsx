import React, { useEffect } from 'react'
import type {
  DraggableProvided,
  DraggableRubric,
  DraggableStateSnapshot,
  DropResult,
  DroppableProvided,
} from '@hello-pangea/dnd'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'

import { DataValidationType } from '@univerjs/core'
import { log } from '../../utils/log'
import { t } from '../../lang/helpers'
import { useUniver } from '../../context/UniverContext'

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string // 用来分组的列（比如 "A"）
  hiddenColumns: string[]
  order: string[] // 分组的顺序
}

interface IKanbanTabProps {
  data: IKanbanConfig
}

interface ITask {
  id: string
  content: string
}

interface IColumn {
  id: string
  title: string
  taskIds: string[]
}

interface IBoard {
  tasks: Record<string, ITask[]>
  columns: Record<string, IColumn[]>
}

export function KanbanTab(props: IKanbanTabProps) {
  const { univerApi } = useUniver()
  const { data } = props

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
    log('[KanbanTab]', '挂载')
  }, [])

  // useEffect(() => {
  //   const grouped: IGroups = getData()
  //   setColumns(grouped)
  // }, [univerApi, data.sheetId, data.groupColumn])

  // 拖拽逻辑
  const handleDragEnd = (result: DropResult) => {

  }

  return (
    <div className="kanban flex flex-col border">
      <DragDropContext
        onDragEnd={handleDragEnd}
        children={(
          <Droppable
            droppableId="1"
            type="COLUMN"
            direction="horizontal"
          >
            {(provided: DroppableProvided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col"
              >
                <Draggable
                  draggableId="1"
                  index={0}
                  children={
                    (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubic: DraggableRubric) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white rounded shadow p-2 mb-2"
                      >
                        123
                      </div>
                    )
                  }
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      />
    </div>
  )
}
