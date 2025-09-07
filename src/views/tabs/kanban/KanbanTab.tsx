import React, { useCallback, useMemo, useState } from 'react'
import type {
  DropResult,
} from '@hello-pangea/dnd'
import { DragDropContext } from '@hello-pangea/dnd'

import { DataValidationType } from '@univerjs/core'
import { Button } from 'antd'
import { log } from '../../../utils/log'
import { t } from '../../../lang/helpers'
import { useUniver } from '../../../context/UniverContext'
import { emitEvent, useEventBus } from '../../../utils/useEventBus'
import { SettingDrawer } from './setting-drawer'
import { Column } from './column'

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
  columns: Record<string, IColumn>
  columnOrder: string[]
}

export function KanbanTab(props: IKanbanTabProps) {
  const { univerApi } = useUniver()
  const { data } = props
  const [board, setBoard] = useState<IBoard>({
    tasks: {},
    columns: {},
    columnOrder: [],
  })
  const [homeDroppableId, setHomeDroppableId] = useState<string>('')

  // 从 sheet 获取数据并分组
  const getData = useCallback(() => {
    if (!univerApi)
      return {}
    const sheet = univerApi.getActiveWorkbook().getSheetBySheetId(data.sheetId)
    if (!sheet) {
      return {}
    }
    const range = sheet.getDataRange()
    if (!range) {
      return {}
    }
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
    if (!values || values.length === 0) {
      return {
        tasks: [],
        columns: [],
      }
    }

    const columns: Record<string, IColumn> = {}
    groups.forEach((group, index) => {
      const id = group
      columns[id] = {
        id,
        title: group,
        color: colors[index],
        taskIds: [],
      }
    })
    // 添加未分组列
    columns.notGroup = {
      id: 'notGroup',
      title: t('KANBAN_NOT_GROUP'),
      color: '#f0f0f0',
      taskIds: [],
    }
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
          Object.values(columns).forEach((item) => {
            if (item.title === row[colIndex]) {
              item.taskIds.push(rowIndex)
            }
          })
        }
        else {
          columns.notGroup.taskIds.push(rowIndex)
        }
      }
    })

    const board = {
      tasks,
      columns,
      columnOrder: Object.keys(columns),
    }
    log('[KanbanTab]', 'getData result', board)
    return board
  }, [])

  const reload = useCallback(() => {
    const newBoard = getData()
    log('[KanbanTab]', 'reload')
    setBoard(newBoard)
  }, [getData])

  const sheetChangeHandler = useCallback(() => {
    reload()
  }, [reload])

  useEventBus('sheetChange', sheetChangeHandler)

  useMemo(() => {
    reload()
  }, [univerApi, data.sheetId, data.groupColumn])

  const handleDragStart = (start) => {
    log('handleDragStart', start)
    setHomeDroppableId(start.source.droppableId)
  }
  // 拖拽逻辑
  const handleDragEnd = (result: DropResult) => {
    // draggableId 就是 task 的 rowIndex
    const { source, destination, draggableId } = result
    log('[KanbanTab]', 'handleDragEnd', source, destination, draggableId)
    // dropped nowhere
    if (!destination) {
      return
    }

    // did not move anywhere - can bail early
    if (
      source.droppableId === destination.droppableId
      && source.index === destination.index
    ) {
      return
    }

    // 移动任务
    const start = board.columns[source.droppableId]
    const finish = board.columns[destination.droppableId]
    if (!start || !finish) {
      return
    }
    if (start === finish) {
      // 不能在本列拖动顺序
      // const newTaskIds = Array.from(start.taskIds)
      // newTaskIds.splice(source.index, 1)
      // newTaskIds.splice(destination.index, 0, draggableId)

      // const newColumn = {
      //   ...start,
      //   taskIds: newTaskIds,
      // }

      // const newBoard = {
      //   ...board,
      //   columns: {
      //     ...board.columns,
      //     [newColumn.id]: newColumn,
      //   },
      // }

      // setBoard(newBoard)
      return
    }

    const startTaskIds = Array.from(start.taskIds)
    startTaskIds.splice(source.index, 1)
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    }

    const finishTaskIds = Array.from(finish.taskIds)
    finishTaskIds.splice(destination.index, 0, draggableId)
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    }

    const newMultiBoard = {
      ...board,
      columns: {
        ...board.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    }

    setBoard(newMultiBoard)

    const colIndex = Number.parseInt(data.groupColumn)
    const rowIndx = Number.parseInt(draggableId) // draggableId 就是 task 的 rowIndex
    emitEvent('tabChange', {
      sheetId: data.sheetId,
      rowIndex: rowIndx,
      colIndex,
      value: finish.title,
    })
  }

  const [settingDrawerOpen, setSettingDrawerOpen] = useState(false)

  const handleSettingDrawerOpen = () => {
    setSettingDrawerOpen(true)
  }

  const handleSettingDrawerClose = () => {
    setSettingDrawerOpen(false)
  }

  return (
    <div className="kanban flex flex-col gap-2">
      <div className="kanban-tool-bar flex flex-row-reverse p-2 bg-secondary">
        <Button size="small" onClick={handleSettingDrawerOpen}>
          {t('KANBAN_SETTING')}
        </Button>
      </div>
      <div className="kanban-columns flex flex-row gap-2 p-2">
        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          children={null}
        >
          {
            board.columnOrder.map((columnId) => {
              const column = board.columns[columnId]
              const tasks = column.taskIds.map((taskId) => {
                return board.tasks[taskId]
              })
              if (columnId == 'notGroup' && tasks.length === 0) {
                return null
              }
              const isDropDisabled = homeDroppableId === columnId
              log('[KanbanTab]', 'isDropDisabled', isDropDisabled, homeDroppableId, columnId)
              return (
                <Column
                  key={columnId}
                  column={column}
                  tasks={tasks}
                  isDropDisabled={isDropDisabled}
                />
              )
            })
          }
        </DragDropContext>
      </div>
      <SettingDrawer open={settingDrawerOpen} onClose={handleSettingDrawerClose} />
    </div>
  )
}
