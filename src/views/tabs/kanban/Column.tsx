import React from 'react'
import { Droppable } from '@hello-pangea/dnd'
import type { IColumn, ITask } from './KanbanTab'
import { Task } from './task'

export interface IColumnProps {
  column: IColumn
  tasks: ITask[]
  isDropDisabled: boolean
}
export function Column(props: IColumnProps) {
  const { column, tasks, isDropDisabled } = props
  const { id, color, title } = column
  return (
    <div className="border border-solid border-gray-300 w-[300px] min-h-[100px] rounded-sm">
      <div className="p-2 border-b font-bold border-gray-300" style={{ color }}>{title}</div>
      <Droppable droppableId={id} isDropDisabled={isDropDisabled}>
        {(provided, snapshot) => (
          <div
            className={`flex flex-col gap-2 p-2 ${snapshot.isDraggingOver ? 'bg-sky-100' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {
              tasks.map((task, index) => {
                return (
                  <Task
                    key={`${task.rowIndex}`}
                    task={task}
                    index={index}
                  />
                )
              })
            }
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
