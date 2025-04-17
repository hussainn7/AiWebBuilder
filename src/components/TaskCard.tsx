
import { format } from "date-fns";
import { Task } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import UserAvatarGroup from "./UserAvatarGroup";
import { Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

const TaskCard = ({ task, onClick, className }: TaskCardProps) => {
  const completedSubtasks = task.subTasks.filter(st => st.completed).length;
  const totalSubtasks = task.subTasks.length;
  const hasSubtasks = totalSubtasks > 0;
  
  // Format date to Russian format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yyyy");
    } catch (error) {
      return "Нет даты";
    }
  };

  return (
    <Card 
      className={cn("cursor-pointer hover:border-primary/50 transition-colors", className)}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="font-medium line-clamp-2">{task.title}</div>
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
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.dueDate)}</span>
          </div>
          
          {hasSubtasks && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <CheckSquare className="h-3 w-3" />
              <span>
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}
        </div>
        
        <div className="w-full flex justify-between items-center mt-2">
          <UserAvatarGroup users={task.assignees} />
          
          {task.comments.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {task.comments.length} комм.
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
