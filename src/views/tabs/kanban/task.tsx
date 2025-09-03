import React from 'react'
import type { DraggableProvided } from '@hello-pangea/dnd'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from 'antd'
import type { ITask } from './KanbanTab'

export interface ITaskProps {
  taskId: string
  task: ITask
  index: number
}

export function Task({ taskId, task, index }: ITaskProps) {
  return (
    <Draggable
      draggableId={`task-${taskId}`}
      index={index}
      children={
        (provided: DraggableProvided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="flex flex-col gap-2"
          >
            <Card
              size="small"
            >
              {task.content.map(c => (
                <p key={`${task.rowIndex}-${c.colIndex}`}>
                  <span className="font-bold">
                    {`${c.title}: `}
                  </span>
                  <span className="text-gray-500">{c.content}</span>
                </p>
              ))}
            </Card>
          </div>
        )
      }
    />
  )
}
