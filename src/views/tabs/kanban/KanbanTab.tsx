import React, { useMemo, useState } from 'react'
import type {
  DropResult,
  DroppableProvided,
} from '@hello-pangea/dnd'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { DataValidationType } from '@univerjs/core'
import { log } from '../../../utils/log'
import { t } from '../../../lang/helpers'
import { useUniver } from '../../../context/UniverContext'

export interface IKanbanConfig {
  sheetId: string
  groupColumn: string // 用来分组的列（比如 "A"）
  hiddenColumns: string[]
  order: string[] // 分组的顺序
}

export interface IKanbanTabProps {
  id: string
  data: IKanbanConfig
}

export interface ITaskContent {
  colIndex: number // 列号
  title: string // 标题，读取的当前列第一行的数据
  content: string
}

export interface ITask {
  rowIndex: number // 行号
  content: ITaskContent[] // 列号为 key
}

export interface IColumn {
  id: string
  title: string
  taskIds: number[]
}

export interface IBoard {
  tasks: Record<number, ITask[]>
  columns: IColumn[]
}

export function KanbanTab(props: IKanbanTabProps) {
  const { univerApi } = useUniver()
  const { data } = props
  const [board, setBoard] = useState<IBoard>({
    tasks: {},
    columns: [],
  })

  // 从 sheet 获取数据并分组
  const getData = () => {
    if (!univerApi)
      return {}
    const sheet = univerApi.getActiveWorkbook().getSheetBySheetId(data.sheetId)
    const range = sheet.getDataRange()
    const colIndex = Number.parseInt(data.groupColumn)
    const groupColumn = sheet.getRange(0, colIndex, range.getLastRow() - range.getRow())
    const validations = groupColumn.getDataValidations()
    let groups: string[] = [] // 分组选项列，读取数据验证的设置
    validations.forEach((item) => {
      const { rule } = item
      if (rule.type === DataValidationType.LIST) {
        groups = rule.formula1.split(',')
      }
    })

    const values = range.getDisplayValues()
    log('[KanbanTab]', 'getData', values)
    if (!values || values.length === 0) {
      return {
        tasks: [],
        columns: [],
      }
    }

    const columns: IColumn[] = groups.map(group => ({
      id: group,
      title: group,
      taskIds: [],
    }))
    // 添加未分组列
    columns.push({
      id: 'not_group',
      title: t('KANBAN_NOT_GROUP'),
      taskIds: [],
    })
    const tasks: Record<number, ITask> = {}
    let header = [] // 表头
    values.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        header = row
      }
      else {
        const task: ITask = {
          rowIndex,
          content: [],
        }
        const content: ITaskContent[] = []
        row.forEach((item, colIndex) => {
          content.push({
            colIndex,
            title: header[colIndex],
            content: item,
          })
        })
        task.content = content
        tasks[rowIndex] = task

        // 分组
        if (groups.includes(row[colIndex])) {
          columns.find(item => item.title === row[colIndex])?.taskIds.push(rowIndex)
        }
        else {
          columns.find(item => item.title === t('KANBAN_NOT_GROUP'))?.taskIds.push(rowIndex)
        }
      }
    })
    log('[KanbanTab]', 'getData result', {
      tasks,
      columns,
    })

    return {
      tasks,
      columns,
    }
  }

  useMemo(() => {
    log('[KanbanTab]', '挂载')
    const board = getData()
    setBoard(board)
  }, [univerApi, data.sheetId, data.groupColumn])

  // 拖拽逻辑
  const handleDragEnd = (result: DropResult) => {

  }

  return (
    <div className="kanban flex flex-col border p-2">
      <DragDropContext
        onDragEnd={handleDragEnd}
        children={
          board.columns.map((column) => {
            log('[KanbanTab]', 'DragDropContext children', column)
            // return <div key={column.id}>{column.title}</div>
            return (
              <Droppable
                droppableId={column.id}
                type="COLUMN"
                direction="horizontal"
              >
                <div className="border bg-gray-300 w-[200px]">
                  <div className="bg-gray-100">
                    <div>{column.title}</div>
                  </div>
                  {
                    (provided: DroppableProvided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex flex-col max-w-[200px]"
                      >
                        {/* {column.taskIds.map(taskId => (
                          <Task task={board.tasks[taskId]} />
                        ))} */}
                        <div key={column.id}>{column.title}</div>
                        {provided.placeholder}
                      </div>
                    )
                  }
                </div>
              </Droppable>
            )
          })
        }
      />
    </div>
  )
}
