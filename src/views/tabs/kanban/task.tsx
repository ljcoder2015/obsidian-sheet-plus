import React, { useEffect } from 'react'
import type { DraggableProvided, DraggableRubric, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from 'antd'
import { log } from '../../../utils/log'
import type { ITask } from './KanbanTab'

export function Task({ task }: { task: ITask }) {
  useEffect(() => {
    log('[Task]', 'Task 挂载 props', task)
  }, [])

  return (
    <Draggable
      draggableId={task.rowIndex.toString()}
      index={task.rowIndex}
      children={
        (provided: DraggableProvided, snapshot: DraggableStateSnapshot, rubic: DraggableRubric) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-2"
          >
            <Card
              size="small"
              type="inner"
            >
              <div className="flex flex-col gap-2">
                {task.content.map(c => (
                  <div key={c.colIndex}>
                    <p>
                      <span className="font-bold">
                        {`${c.title}: `}
                      </span>
                      <span className="text-gray-500">{c.content}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )
      }
    />
  )
}
