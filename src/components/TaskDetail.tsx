import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, User, Status, SubTask } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers, getClients, getProjects, updateTask, sendNotification } from '@/lib/api-utils';
import { toast } from 'sonner';
import UserAvatar from '@/components/UserAvatar';
import { CalendarIcon, Plus, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { CustomBadge } from './ui/custom-badge';

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "in-progress", label: "В процессе" },
  { value: "under-review", label: "На проверке" },
  { value: "completed", label: "Завершено" },
  { value: "canceled", label: "Отменено" }
];

export function TaskDetail({ task, open, onOpenChange, onTaskUpdated }: TaskDetailProps) {
  const { user, token, addNotification } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  
  // Task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  
  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(token),
    enabled: !!token
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(token),
    enabled: !!token
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(token),
    enabled: !!token
  });
  
  // Check if user can edit this task
  const canEditTask = () => {
    if (!task || !user) return false;
    // Only the creator of the task or an admin can edit it
    return user.role === 'admin' || task.createdBy === user.id;
  };
  
  // Initialize form with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'draft');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setClientId(task.clientId);
      setProjectId(task.projectId);
      setAssigneeIds(task.assignees && task.assignees.length > 0 ? task.assignees.map(a => a.id) : []);
      setSubtasks(task.subTasks || []);
    }
  }, [task]);
  
  // Reset editing state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);
  
  // Filter projects based on selected client
  const filteredProjects = clientId 
    ? projects.filter(project => project.clientId === clientId)
    : projects;
  
  // Handle adding a new subtask
  const addSubtask = () => {
    setSubtasks([...subtasks, { id: crypto.randomUUID(), title: '', completed: false }]);
  };
  
  // Handle removing a subtask
  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };
  
  // Handle subtask title change
  const updateSubtaskTitle = (id: string, title: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, title } : st));
  };
  
  // Handle subtask completion toggle
  const toggleSubtaskCompletion = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };
  
  // Get assigned users from their IDs
  const getAssignedUsers = () => {
    if (!task) return [];
    
    // If task already has populated assignees array, use it
    if (task.assignees && Array.isArray(task.assignees)) {
      return task.assignees;
    }
    
    // Otherwise, use assigneeIds to find users
    if (task.assigneeIds && Array.isArray(task.assigneeIds)) {
      return task.assigneeIds
        .map(id => users.find(user => user.id === id))
        .filter(Boolean) as User[];
    }
    
    return [];
  };
  
  // Save task changes
  const saveChanges = async () => {
    if (!task) return;
    
    try {
      // Prepare updated task data
      const updatedTask = {
        ...task,
        title,
        description,
        status,
        dueDate: dueDate ? dueDate.toISOString() : task.dueDate,
        clientId,
        projectId,
        assigneeIds,
        subTasks: subtasks,
      };
      
      // Get previous assignees to determine who's newly assigned
      const previousAssigneeIds = task.assignees && task.assignees.length > 0 
        ? task.assignees.map(a => a.id) 
        : [];
      const newAssigneeIds = assigneeIds.filter(id => !previousAssigneeIds.includes(id));
      
      // Update the task
      await updateTask(task.id, updatedTask, token || '');
      
      // Send notifications to newly assigned users
      if (newAssigneeIds.length > 0) {
        // Get client and project names for the notification
        const clientName = clientId
          ? clients.find(c => c.id === clientId)?.name || "Неизвестный клиент"
          : "Без клиента";
          
        const projectName = projectId
          ? projects.find(p => p.id === projectId)?.name || "Неизвестный проект"
          : "Без проекта";
        
        // Notify each newly assigned user
        newAssigneeIds.forEach(userId => {
          // Don't notify the creator
          if (userId !== user?.id) {
            // Find user info for personalized notification
            const assignedUser = users.find(u => u.id === userId);
            if (assignedUser) {
              // Create notification object
              const notification = {
                type: "task_assignment",
                title: "Новое назначение задачи",
                message: `Вы были назначены на задачу "${title}" ${projectName !== "Без проекта" ? `для проекта "${projectName}"` : ''} ${clientName !== "Без клиента" ? `(клиент: ${clientName})` : ''}. Статус задачи: ${status}.`,
                entityId: task.id,
                entityType: "task" as "task" | "project" | "client",
                taskId: task.id
              };
              
              // Add notification to current user's context
              addNotification(notification);
              
              // Also send notification to the server for the assigned user
              // This ensures the notification persists and is visible when the assigned user logs in
              try {
                sendNotification(userId, notification, token || '');
              } catch (error) {
                console.error("Error sending notification to user:", error);
              }
            }
          }
        });
      }
      
      // Show success message
      toast.success('Задача успешно обновлена');
      
      // Reset editing state
      setIsEditing(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-tasks'] });
      
      // Call onTaskUpdated callback if provided
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Не удалось обновить задачу');
    }
  };
  
  if (!task) return null;
  
  // Get assigned users
  const assignedUsers = getAssignedUsers();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="task-detail-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? (
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-xl font-semibold"
              />
            ) : (
              <div className="flex items-center justify-between w-full">
                <span>{task.title}</span>
                <CustomBadge variant={status}>{statusOptions.find(s => s.value === status)?.label || status}</CustomBadge>
              </div>
            )}
          </DialogTitle>
          <p id="task-detail-description" className="sr-only">Подробная информация о задаче</p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="details">Детали</TabsTrigger>
            <TabsTrigger value="subtasks">Подзадачи</TabsTrigger>
            <TabsTrigger value="comments">Комментарии</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-2">Описание</h3>
              {isEditing ? (
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="min-h-[100px]"
                />
              ) : (
                <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                  {task.description || "Нет описания"}
                </div>
              )}
            </div>
            
            {/* Status */}
            {isEditing && (
              <div>
                <h3 className="text-sm font-medium mb-2">Статус</h3>
                <Select value={status} onValueChange={(value: Status) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium mb-2">Срок выполнения</h3>
              {isEditing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "dd.MM.yyyy") : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="bg-muted p-3 rounded-md">
                  {task.dueDate ? format(new Date(task.dueDate), "dd.MM.yyyy") : "Срок не указан"}
                </div>
              )}
            </div>
            
            {/* Client */}
            <div>
              <h3 className="text-sm font-medium mb-2">Клиент</h3>
              {isEditing ? (
                <Select 
                  value={clientId || ''} 
                  onValueChange={(value) => {
                    setClientId(value === 'none' ? undefined : value);
                    // Reset project if client changes
                    setProjectId(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-muted p-3 rounded-md">
                  {task.client ? task.client.name : "Нет клиента"}
                </div>
              )}
            </div>
            
            {/* Project */}
            <div>
              <h3 className="text-sm font-medium mb-2">Проект</h3>
              {isEditing ? (
                <Select 
                  value={projectId || ''} 
                  onValueChange={(value) => setProjectId(value === 'none' ? undefined : value)}
                  disabled={!clientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!clientId ? "Сначала выберите клиента" : "Выберите проект"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет</SelectItem>
                    {filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-muted p-3 rounded-md">
                  {task.project ? task.project.name : "Нет проекта"}
                </div>
              )}
            </div>
            
            {/* Assignees */}
            <div>
              <h3 className="text-sm font-medium mb-2">Исполнители</h3>
              {isEditing ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>
                        {assigneeIds.length 
                          ? `Выбрано исполнителей: ${assigneeIds.length}` 
                          : "Выберите исполнителей"}
                      </span>
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {users.map((user) => (
                      <DropdownMenuCheckboxItem
                        key={user.id}
                        checked={assigneeIds.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // Only select this user, replacing any previous selection
                            setAssigneeIds([user.id]);
                          } else {
                            // Deselect this user
                            setAssigneeIds(assigneeIds.filter((id) => id !== user.id));
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <UserAvatar user={user} size="sm" />
                          <span className="ml-2">{user.name}</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedUsers && assignedUsers.length > 0 ? (
                    assignedUsers.map((assignee) => (
                      <div key={assignee.id} className="flex items-center bg-muted p-2 rounded-md">
                        <UserAvatar user={assignee} size="sm" />
                        <span className="ml-2">{assignee.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-muted p-3 rounded-md w-full">Нет исполнителей</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Created by */}
            <div>
              <h3 className="text-sm font-medium mb-2">Создано</h3>
              <div className="bg-muted p-3 rounded-md">
                {users.find(u => u.id === task.createdBy)?.name || "Неизвестно"}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="subtasks" className="space-y-4">
            {isEditing && (
              <Button onClick={addSubtask} className="mb-4">
                <Plus className="mr-2 h-4 w-4" /> Добавить подзадачу
              </Button>
            )}
            
            {subtasks && subtasks.length > 0 ? (
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 border rounded-md">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSubtaskCompletion(subtask.id)}
                        >
                          {subtask.completed ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border rounded-sm" />}
                        </Button>
                        <Input
                          value={subtask.title}
                          onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubtask(subtask.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className={cn(
                          "flex items-center gap-2 flex-1",
                          subtask.completed && "line-through text-muted-foreground"
                        )}>
                          {subtask.completed ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border rounded-sm" />}
                          <span>{subtask.title}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Нет подзадач
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4">
            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={users.find(u => u.id === comment.userId)} size="sm" />
                      <span className="font-medium">{users.find(u => u.id === comment.userId)?.name || 'Неизвестно'}</span>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt ? format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm") : ''}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Нет комментариев
              </div>
            )}
            
            {/* Add comment form */}
            {/* ... existing comment form ... */}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {task.editHistory && task.editHistory.length > 0 ? (
              <div className="space-y-4">
                {task.editHistory.map((edit, index) => (
                  <div key={index} className="bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={users.find(u => u.id === edit.userId)} size="sm" />
                      <span className="font-medium">{users.find(u => u.id === edit.userId)?.name || 'Неизвестно'}</span>
                      <span className="text-xs text-muted-foreground">
                        {edit.timestamp ? format(new Date(edit.timestamp), "dd.MM.yyyy HH:mm") : ''}
                      </span>
                    </div>
                    <p>Изменения: {edit.changes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Нет истории изменений
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button onClick={saveChanges}>
                Сохранить
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
              {canEditTask() && (
                <Button onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
