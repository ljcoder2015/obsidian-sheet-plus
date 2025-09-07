import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import type { ITask } from './KanbanTab'

export interface ITaskProps {
  task: ITask
  index: number
}

export function Task({ task, index }: ITaskProps) {
  return (
    <Draggable draggableId={`${task.rowIndex}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white flex flex-col gap-2 border border-gray-200 p-2 rounded-sm ${
            snapshot.isDragging ? 'bg-blue-100' : ''
          }`}
        >
          {task.content.map(c => (
            <p key={`${task.rowIndex}-${c.colIndex}`}>
              <span className="font-bold">
                {`${c.title}: `}
              </span>
              <span className="text-gray-500">{c.content}</span>
            </p>
          ))}
        </div>
      )}
    </Draggable>
  )
}
