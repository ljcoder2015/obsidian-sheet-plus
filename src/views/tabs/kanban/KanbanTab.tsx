import React, { useMemo, useState } from 'react'
import type {
  DraggableLocation,
  DropResult,
  DroppableProvided,
} from '@hello-pangea/dnd'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'

import { DataValidationType } from '@univerjs/core'
import { Card, Flex } from 'antd'
import { log } from '../../../utils/log'
import { t } from '../../../lang/helpers'
import { useUniver } from '../../../context/UniverContext'
import { randomString } from '../../../utils/uuid'
import { useEventBus } from '../../../utils/useEventBus'
import { Task } from './task'

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
  color: string
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
    let colors: string[] = []
    validations.forEach((item) => {
      const { rule } = item
      if (rule.type === DataValidationType.LIST) {
        groups = rule.formula1.split(',')
        colors = rule.formula2.split(',')
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

    const columns: IColumn[] = groups.map((group, index) => ({
      id: randomString(6),
      title: group,
      color: colors[index],
      taskIds: [],
    }))
    // 添加未分组列
    columns.push({
      id: 'not_group',
      title: t('KANBAN_NOT_GROUP'),
      color: '#f0f0f0',
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
        row.forEach((item, index) => {
          content.push({
            colIndex: index,
            title: header[index],
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

  const reload = () => {
    const board = getData()
    setBoard(board)
  }

  useEventBus('sheetChange', () => {
    reload()
  })

  useMemo(() => {
    log('[KanbanTab]', '挂载')
    reload()
  }, [univerApi, data.sheetId, data.groupColumn])

  // 拖拽逻辑
  const handleDragEnd = (result: DropResult) => {
    // dropped nowhere
    if (!result.destination) {
      return
    }

    const source: DraggableLocation = result.source
    const destination: DraggableLocation = result.destination

    // did not move anywhere - can bail early
    if (
      source.droppableId === destination.droppableId
      && source.index === destination.index
    ) {
      return
    }

    // 移动任务
    const sourceColumn = board.columns.find(item => item.id === source.droppableId)
    const destinationColumn = board.columns.find(item => item.id === destination.droppableId)
    if (!sourceColumn || !destinationColumn) {
      return
    }
    // 移动任务
    const taskId = sourceColumn.taskIds[source.index]
    const task = board.tasks[taskId]
    sourceColumn.taskIds.splice(source.index, 1)
    destinationColumn.taskIds.splice(destination.index, 0, taskId)
    // 更新 board
    const newBoard = {
      ...board,
      columns: board.columns.map((item) => {
        if (item.id === sourceColumn.id) {
          return {
            ...item,
            taskIds: sourceColumn.taskIds,
          }
        }
        if (item.id === destinationColumn.id) {
          return {
            ...item,
            taskIds: destinationColumn.taskIds,
          }
        }
        return item
      }),
    }
    log('[KanbanTab]', 'handleDragEnd', 'result', result, `newBoard`, newBoard)
    setBoard(newBoard)

    const colIndex = Number.parseInt(data.groupColumn)
    univerApi.getActiveWorkbook().getSheetBySheetId(data.sheetId).getRange(task.rowIndex, colIndex).setValue(destinationColumn.title)
  }

  return (
    <Flex className="kanban p-2" gap="middle" horizontal>
      <DragDropContext
        onDragEnd={handleDragEnd}
        children={null}
      >
        {
          board.columns.map((column) => {
            return (
              <Card
                key={column.id}
                size="small"
                title={column.title}
                className="w-[300px]"
                style={{
                  color: column.color,
                }}
              >
                <Droppable
                  droppableId={column.id}
                >
                  {(provided: DroppableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="p-2"
                    >
                      {column.taskIds.map((taskId, index) => (
                        <Task
                          taskId={taskId} // 用于 Draggable 的 draggableId
                          task={board.tasks[taskId]}
                          index={index} // 用于 Draggable 的 index
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card>
            )
          })
        }
      </DragDropContext>
    </Flex>
  )
}
