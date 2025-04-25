import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEnhancedTasks, getTasks, getUsers, deleteTask } from "@/lib/api-utils";
import TaskCard from "@/components/TaskCard";
import KanbanBoard from "@/components/KanbanBoard";
import { Task, Status, User } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Search } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { TaskForm } from "@/components/TaskForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TaskDetail } from "@/components/TaskDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tasks = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all tasks
  const { 
    data: allTasks = [], 
    refetch: refetchTasks,
    isLoading: tasksLoading,
    isError: tasksError
  } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: () => getEnhancedTasks(token),
    enabled: !!token,
    // Reduce stale time to ensure fresh data on initial load
    staleTime: 0,
    // Fetch immediately on component mount
    refetchOnMount: true
  });

  // Fetch users from the server
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(token),
    enabled: !!token,
    staleTime: 0,
    refetchOnMount: true
  });

  // Local state
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  
  // Force refresh when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Immediate refresh when dialog closes
      refetchTasks();
      refetchUsers();
      // Also invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  };
  
  // Setup effect to periodically refresh data
  useEffect(() => {
    // Initial data load
    if (token) {
      refetchTasks();
      refetchUsers();
    }
    
    // Set up a refresh interval
    const refreshIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && token) {
        refetchTasks();
      }
    }, 3000); // Refresh every 3 seconds when tab is visible
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshIntervalId);
  }, [refetchTasks, refetchUsers, token]);
  
  // Filter tasks based on search query, selected users
  const filteredTasks = useMemo(() => {
    // Start with all tasks
    return allTasks.filter(task => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query) && 
            !task.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Filter by selected users
      if (selectedUsers.length > 0) {
        const hasSelectedUser = task.assignees && 
          task.assignees.some(assignee => selectedUsers.includes(assignee.id));
        
        if (!hasSelectedUser) {
          return false;
        }
      }
      
      // If it passed all filters, include it
      return true;
    });
  }, [allTasks, searchQuery, selectedUsers]);

  // Group tasks by status for Kanban board
  const filteredTasksByStatus = useMemo(() => ({
    draft: filteredTasks.filter(task => task.status === "draft"),
    "in-progress": filteredTasks.filter(task => task.status === "in-progress"),
    "under-review": filteredTasks.filter(task => task.status === "under-review"),
    completed: filteredTasks.filter(task => task.status === "completed"),
    canceled: filteredTasks.filter(task => task.status === "canceled")
  }), [filteredTasks]);

  // Handle task status change (drag and drop)
  const handleTaskMove = async (taskId: string, newStatus: Status) => {
    try {
      // Find the task
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Check if user can move the task (only creator or admin can change status)
      if (user && (user.role === 'admin' || task.createdBy === user.id)) {
        // Optimistically update UI
        const updatedTasks = allTasks.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        );
        
        // Update the cache immediately
        queryClient.setQueryData(["enhanced-tasks"], updatedTasks);
        
        // Update task status on the server
        await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: newStatus })
        });
        
        // Refresh tasks to ensure we have the latest data
        refetchTasks();
      } else {
        toast.error('Только создатель задачи может изменить её статус');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Не удалось обновить статус задачи');
      // Revert optimistic update on error
      refetchTasks();
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Find the task
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Check if user can delete the task (only creator or admin can delete)
      if (user && (user.role === 'admin' || task.createdBy === user.id)) {
        // Optimistically update UI
        const updatedTasks = allTasks.filter(t => t.id !== taskId);
        
        // Update the cache immediately
        queryClient.setQueryData(["enhanced-tasks"], updatedTasks);
        
        // Call the API to delete the task
        await deleteTask(taskId, token || '');
        
        // Show success message
        toast.success('Задача успешно удалена');
        
        // Refresh tasks and calendar data
        refetchTasks();
        queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      } else {
        toast.error('Только создатель задачи может удалить её');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Не удалось удалить задачу');
      // Revert optimistic update on error
      refetchTasks();
    }
  };
  
  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    // If the user is already selected, clear the selection
    if (selectedUsers.includes(userId)) {
      setSelectedUsers([]);
    } else {
      // Otherwise, select only this user (replacing any previous selection)
      setSelectedUsers([userId]);
    }
  };

  // Handle task click to open task detail
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };
  
  // Handle task detail close
  const handleTaskDetailClose = () => {
    setTaskDetailOpen(false);
    setSelectedTask(null);
  };
  
  // Handle task update
  const handleTaskUpdated = () => {
    refetchTasks();
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["tasks-by-status"] });
    queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
  };

  return (
    <MainLayout title="Задачи">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск задач..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Исполнители <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {usersLoading ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Загрузка пользователей...
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      if (selectedUsers.includes(user.id)) {
                        setSelectedUsers([]);
                      } else {
                        setSelectedUsers([user.id]);
                      }
                    }}
                  >
                    <div className="mr-2 h-4 w-4 flex items-center justify-center">
                      {selectedUsers.includes(user.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserAvatar user={user} size="sm" />
                      <span>{user.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Нет доступных пользователей
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={view === "kanban" ? "default" : "ghost"} 
              className="rounded-none flex-1"
              onClick={() => setView("kanban")}
            >
              Канбан
            </Button>
            <Button 
              variant={view === "list" ? "default" : "ghost"} 
              className="rounded-none flex-1"
              onClick={() => setView("list")}
            >
              Список
            </Button>
          </div>
          
          <Button className="gap-1" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Добавить задачу
          </Button>
        </div>
      </div>
      
      {tasksLoading ? (
        <Skeleton className="h-96" />
      ) : (
        view === "kanban" ? (
          <KanbanBoard 
            tasks={filteredTasksByStatus} 
            onTaskMove={handleTaskMove} 
            onDelete={handleDeleteTask}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onDelete={handleDeleteTask}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-muted-foreground">Задачи не найдены</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Попробуйте изменить параметры поиска
                </p>
              </div>
            )}
          </div>
        )
      )}
      
      <TaskForm 
        open={dialogOpen} 
        onOpenChange={handleDialogOpenChange} 
        onTaskCreated={() => {
          refetchTasks();
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["tasks-by-status"] });
          queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
          queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
        }}
      />
      
      <TaskDetail 
        task={selectedTask} 
        open={taskDetailOpen} 
        onOpenChange={setTaskDetailOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </MainLayout>
  );
};

export default Tasks;
