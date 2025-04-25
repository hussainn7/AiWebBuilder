import { format } from "date-fns";
import { Task } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import UserAvatarGroup from "./UserAvatarGroup";
import { Calendar, CheckSquare, Trash2, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
  onDelete?: (taskId: string) => void;
}

const TaskCard = ({ task, onClick, className, onDelete }: TaskCardProps) => {
  const completedSubtasks = task.subTasks.filter(st => st.completed).length;
  const totalSubtasks = task.subTasks.length;
  const hasSubtasks = totalSubtasks > 0;
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Check if user is admin or creator of the task
  const canDelete = user?.role === 'admin' || task.createdBy === user?.id;
  
  // Check if task is completed and should show auto-delete warning
  const isCompleted = task.status === 'completed';

  // Check if this task belongs to the current user
  const isMyTask = user && (
    (task.assignees && task.assignees.some(assignee => assignee.id === user.id)) ||
    task.createdBy === user.id
  );
  
  // Format date to Russian format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yyyy");
    } catch (error) {
      return "Нет даты";
    }
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setShowDeleteDialog(true);
  };
  
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(task.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer hover:border-primary/50 transition-colors relative", 
          isCompleted && "border-green-200 bg-green-50/30",
          isMyTask && "border-blue-400 shadow-md",
          className
        )}
        onClick={onClick}
      >
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        {isMyTask && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs flex items-center z-10">
            <User className="h-3 w-3 mr-1" />
            Моя задача
          </div>
        )}
        
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="font-medium line-clamp-2 pr-6">{task.title}</div>
          <StatusBadge status={task.status} />
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {task.description}
          </p>
          
          {task.client && (
            <div className="mt-2 text-xs text-muted-foreground">
              Клиент: {task.client.name}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          {hasSubtasks && (
            <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <div>
                {completedSubtasks} из {totalSubtasks} подзадач выполнено
              </div>
            </div>
          )}
          
          {task.dueDate && (
            <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <div>
                Срок: {formatDate(task.dueDate)}
              </div>
            </div>
          )}
          
          {task.assignees && task.assignees.length > 0 && (
            <div className="w-full flex items-center justify-between mt-1">
              <UserAvatarGroup users={task.assignees} />
            </div>
          )}
          
          {isCompleted && (
            <div className="w-full flex items-center gap-2 text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-md">
              <AlertCircle className="h-3 w-3" />
              <div>
                Задача будет автоматически удалена через 30 дней
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Задача будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskCard;
