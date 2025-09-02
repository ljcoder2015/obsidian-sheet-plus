import React, { useEffect } from 'react'
import type { DraggableProvided, DraggableRubric, DraggableStateSnapshot } from '@hello-pangea/dnd'
import { Draggable } from '@hello-pangea/dnd'
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
            className="bg-white rounded shadow p-2 mb-2"
          >
            <div
              {...provided.dragHandleProps}
              className={snapshot.isDragging ? 'bg-blue-400' : 'bg-gray-300'}
            >
              {task.content.map(c => (
                <div key={c.colIndex}>
                  <div>
                    <span>
                      {c.title}
                      :
                    </span>
                    <span>{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    />
  )
}
