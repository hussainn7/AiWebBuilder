import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Task, TasksByStatus, Status } from "@/lib/types";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Status;
}

const columnTitles: Record<Status, string> = {
  'draft': 'Черновики',
  'in-progress': 'В процессе',
  'under-review': 'На проверке',
  'completed': 'Завершено',
  'canceled': 'Отменено'
};

const KanbanColumn = ({ title, tasks, status }: KanbanColumnProps) => {
  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          className="bg-secondary/50 rounded-lg p-3 min-h-[70vh] w-72 flex-shrink-0"
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          <h3 className="font-medium text-sm mb-3 flex items-center justify-between">
            <span>{title}</span>
            <span className="bg-secondary px-2 rounded text-xs">{tasks.length}</span>
          </h3>
          
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

interface KanbanBoardProps {
  tasks: TasksByStatus;
  onTaskMove?: (taskId: string, newStatus: Status) => void;
}

const KanbanBoard = ({ tasks, onTaskMove }: KanbanBoardProps) => {
  const [localTasks, setLocalTasks] = useState<TasksByStatus>(tasks);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceId = result.source.droppableId as Status;
    const destId = result.destination.droppableId as Status;
    
    if (sourceId === destId) return;
    
    const sourceIndex = result.source.index;
    const taskToMove = {...localTasks[sourceId][sourceIndex]};
    
    // Update local state
    const newTasks = {...localTasks};
    newTasks[sourceId] = newTasks[sourceId].filter(t => t.id !== taskToMove.id);
    taskToMove.status = destId;
    newTasks[destId] = [...newTasks[destId], taskToMove];
    
    setLocalTasks(newTasks);
    
    // Notify parent component
    if (onTaskMove) {
      onTaskMove(taskToMove.id, destId);
    }
  };

  const statuses: Status[] = ['draft', 'in-progress', 'under-review', 'completed', 'canceled'];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 relative z-10">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            title={columnTitles[status]}
            tasks={localTasks[status]}
            status={status}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
