import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Task, TasksByStatus, Status } from "@/lib/types";
import TaskCard from "./TaskCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Status;
  onDelete?: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

const columnTitles: Record<Status, string> = {
  'draft': 'Черновики',
  'in-progress': 'В процессе',
  'under-review': 'На проверке',
  'completed': 'Завершено',
  'canceled': 'Отменено'
};

const KanbanColumn = ({ title, tasks, status, onDelete, onTaskClick }: KanbanColumnProps) => {
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
                    <TaskCard 
                      task={task} 
                      onDelete={onDelete} 
                      onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                    />
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
  onDelete?: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

const KanbanBoard = ({ tasks, onTaskMove, onDelete, onTaskClick }: KanbanBoardProps) => {
  const [localTasks, setLocalTasks] = useState<TasksByStatus>(tasks);
  const { user } = useAuth();

  // Check if user can edit task status
  const canEditTaskStatus = (task: Task) => {
    if (!user) return false;
    return user.role === 'admin' || task.createdBy === user.id;
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceId = result.source.droppableId as Status;
    const destId = result.destination.droppableId as Status;
    
    if (sourceId === destId) return;
    
    const sourceIndex = result.source.index;
    const taskToMove = {...localTasks[sourceId][sourceIndex]};
    
    // Check if user has permission to move this task
    if (!canEditTaskStatus(taskToMove)) {
      toast.error('Только создатель задачи может изменить её статус');
      return;
    }
    
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

  const handleDelete = (taskId: string) => {
    if (!onDelete) return;
    
    const newTasks = {...localTasks};
    Object.keys(newTasks).forEach(status => {
      newTasks[status as Status] = newTasks[status as Status].filter(task => task.id !== taskId);
    });
    
    setLocalTasks(newTasks);
    
    onDelete(taskId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {Object.entries(columnTitles).map(([status, title]) => (
          <KanbanColumn
            key={status}
            title={title}
            tasks={localTasks[status as Status] || []}
            status={status as Status}
            onDelete={handleDelete}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
