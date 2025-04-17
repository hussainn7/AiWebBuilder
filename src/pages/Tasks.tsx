
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getEnhancedTasks, getTasksByStatus, users } from "@/lib/mock-data";
import TaskCard from "@/components/TaskCard";
import KanbanBoard from "@/components/KanbanBoard";
import { Task, Status, User } from "@/lib/types";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Search } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { TaskForm } from "@/components/TaskForm";
import { useQuery } from "@tanstack/react-query";

const Tasks = () => {
  const { data: allTasks = [] } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: getEnhancedTasks
  });

  const { data: tasksByStatus = {
    draft: [],
    'in-progress': [],
    'under-review': [],
    completed: [],
    canceled: []
  } } = useQuery({
    queryKey: ["tasks-by-status"],
    queryFn: getTasksByStatus
  });
  
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter tasks based on search query and selected users
  const filteredTasks = allTasks.filter(task => {
    // Filter by search query
    const matchesQuery = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by selected users
    const matchesUsers = selectedUsers.length === 0 ||
      task.assignees.some(user => selectedUsers.includes(user.id));
    
    return matchesQuery && matchesUsers;
  });
  
  // Group filtered tasks by status for kanban board
  const filteredTasksByStatus = {
    draft: filteredTasks.filter(task => task.status === 'draft'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    'under-review': filteredTasks.filter(task => task.status === 'under-review'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
    canceled: filteredTasks.filter(task => task.status === 'canceled')
  };
  
  // Handle task status change
  const handleTaskMove = (taskId: string, newStatus: Status) => {
    console.log(`Task ${taskId} moved to ${newStatus}`);
    // In a real app, you would update the task status in the database
  };
  
  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
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
              {users.map((user) => (
                <DropdownMenuCheckboxItem
                  key={user.id}
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleUserSelection(user.id)}
                  className="flex items-center gap-2"
                >
                  <UserAvatar user={user} size="sm" />
                  {user.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Tabs defaultValue="kanban" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="kanban" onClick={() => setView("kanban")}>Канбан</TabsTrigger>
              <TabsTrigger value="list" onClick={() => setView("list")}>Список</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button className="gap-1" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Новая задача
          </Button>
        </div>
      </div>
      
      {view === "kanban" ? (
        <KanbanBoard tasks={filteredTasksByStatus} onTaskMove={handleTaskMove} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-xl text-muted-foreground">Задачи не найдены</p>
              <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>
      )}
      
      <TaskForm open={dialogOpen} onOpenChange={setDialogOpen} />
    </MainLayout>
  );
};

export default Tasks;
