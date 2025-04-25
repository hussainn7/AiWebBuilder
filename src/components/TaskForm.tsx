import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, MessageSquare, History, Plus, Trash2, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTask, sendNotification } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { getClients, getProjects, getUsers } from "@/lib/api-utils";
import { Status, User, Task } from "@/lib/types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const statusOptions: { value: Status; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "in-progress", label: "В процессе" },
  { value: "under-review", label: "На проверке" },
  { value: "completed", label: "Завершено" },
  { value: "canceled", label: "Отменено" }
];

interface CommentType {
  text: string;
  author: {
    id: string;
    name: string;
  };
  timestamp: string;
}

interface ChangeHistoryType {
  text: string;
  author: {
    id: string;
    name: string;
  };
  timestamp: string;
}

const taskSchema = z.object({
  title: z.string().min(1, "Название задачи обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  status: z.enum(["draft", "in-progress", "under-review", "completed", "canceled"]),
  dueDate: z.date(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  assigneeIds: z.array(z.string()).min(1, "Требуется хотя бы один исполнитель"),
  subtasks: z.array(z.object({
    title: z.string().min(1, "Название подзадачи обязательно"),
    completed: z.boolean().default(false),
  })),
  fileAttachments: z.array(z.object({
    name: z.string(),
    path: z.string()
  })).optional(),
  comments: z.array(z.object({
    text: z.string(),
    author: z.object({
      id: z.string(),
      name: z.string(),
    }),
    timestamp: z.string()
  })).optional(),
  changeHistory: z.array(z.object({
    text: z.string(),
    author: z.object({
      id: z.string(),
      name: z.string(),
    }),
    timestamp: z.string()
  })).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}

export function TaskForm({ open, onOpenChange, onTaskCreated }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { token, user, addNotification } = useAuth();
  
  // Form state
  const [activeTab, setActiveTab] = useState("details");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [comments, setComments] = useState<{ text: string; author: { id: string; name: string }; timestamp: string }[]>([]);
  const [changeHistory, setChangeHistory] = useState<{ text: string; author: { id: string; name: string }; timestamp: string }[]>([]);
  const [fileAttachments, setFileAttachments] = useState<{ name: string; path: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch data
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(token),
    enabled: !!token
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(token),
    enabled: !!token
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(token),
    enabled: !!token
  });

  // Form definition
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      dueDate: new Date(),
      clientId: "none",
      projectId: "none",
      assigneeIds: user?.id ? [user.id] : [],
      subtasks: [],
      fileAttachments: [],
      comments: [],
      changeHistory: []
    }
  });
  
  // Set current user as assignee when form opens
  useEffect(() => {
    if (open && user?.id) {
      const currentAssignees = form.getValues("assigneeIds");
      // Only add the current user if they're not already in the list
      if (!currentAssignees.includes(user.id)) {
        const newAssignees = [...currentAssignees, user.id];
        form.setValue("assigneeIds", newAssignees);
        setAssigneeIds(newAssignees);
      }
    }
  }, [open, user, form]);
  
  // Watch for client ID changes to filter projects
  const clientId = form.watch("clientId");
  const filteredProjects = clientId && clientId !== "none"
    ? projects.filter(project => project.clientId === clientId)
    : [];
  
  // Reset project when client changes
  useEffect(() => {
    if (clientId === "none") {
      form.setValue("projectId", "none");
    }
  }, [clientId, form]);
  
  // Handle assignee selection
  const handleAssigneeChange = (userId: string, checked: boolean) => {
    if (checked) {
      form.setValue("assigneeIds", [userId]);
      setAssigneeIds([userId]);
    } else {
      form.setValue("assigneeIds", []);
      setAssigneeIds([]);
    }
  };
  
  // Handle subtask actions
  const addSubtask = () => {
    const currentSubtasks = form.getValues("subtasks");
    const newSubtasks = [...currentSubtasks, { title: "", completed: false }];
    form.setValue("subtasks", newSubtasks);
    setSubtasks(newSubtasks as { title: string; completed: boolean }[]);
  };
  
  const removeSubtask = (index: number) => {
    const currentSubtasks = form.getValues("subtasks");
    const newSubtasks = currentSubtasks.filter((_, i) => i !== index);
    form.setValue("subtasks", newSubtasks);
    setSubtasks(newSubtasks as { title: string; completed: boolean }[]);
  };
  
  const updateSubtaskTitle = (index: number, title: string) => {
    const currentSubtasks = form.getValues("subtasks");
    const newSubtasks = currentSubtasks.map((subtask, i) => 
      i === index ? { ...subtask, title } : subtask
    );
    form.setValue("subtasks", newSubtasks);
    setSubtasks(newSubtasks as { title: string; completed: boolean }[]);
  };
  
  const toggleSubtaskCompletion = (index: number) => {
    const currentSubtasks = form.getValues("subtasks");
    const newSubtasks = currentSubtasks.map((subtask, i) => 
      i === index ? { ...subtask, completed: !subtask.completed } : subtask
    );
    form.setValue("subtasks", newSubtasks);
    setSubtasks(newSubtasks as { title: string; completed: boolean }[]);
  };
  
  // Handle file attachments
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // In a real app, you would upload files to a server here
    // For now, we'll just simulate it
    const newAttachments = Array.from(files).map(file => ({
      name: file.name,
      path: URL.createObjectURL(file)
    }));
    
    const currentAttachments = form.getValues("fileAttachments");
    const updatedAttachments = [...currentAttachments, ...newAttachments];
    
    form.setValue("fileAttachments", updatedAttachments);
    setFileAttachments(updatedAttachments as { name: string; path: string }[]);
  };
  
  const removeAttachment = (index: number) => {
    const currentAttachments = form.getValues("fileAttachments");
    const newAttachments = currentAttachments.filter((_, i) => i !== index);
    form.setValue("fileAttachments", newAttachments);
    setFileAttachments(newAttachments as { name: string; path: string }[]);
  };
  
  // Handle comments
  const addComment = () => {
    if (!newComment.trim()) return;
    
    const timestamp = new Date().toISOString();
    const comment = {
      text: newComment,
      author: {
        id: user?.id?.toString() || "unknown",
        name: user?.email?.split("@")[0] || "Пользователь"
      },
      timestamp
    };
    
    const currentComments = form.getValues("comments");
    const newComments = [...currentComments, comment];
    
    form.setValue("comments", newComments);
    setComments(newComments as { text: string; author: { id: string; name: string }; timestamp: string }[]);
    setNewComment("");
  };
  
  // Form submission
  async function onSubmit(values: TaskFormValues) {
    try {
      // Make sure all subtasks have required fields
      const validatedSubtasks = values.subtasks.map(subtask => ({
        title: subtask.title || "",
        completed: !!subtask.completed,
      }));
      
      // Add a single change history entry for the form submission
      const timestamp = new Date().toISOString();
      const currentChangeHistory = values.changeHistory || [];
      const newChangeHistory = [...currentChangeHistory, { 
        text: `Задача создана/обновлена`, 
        author: { 
          id: user?.id?.toString() || "unknown", 
          name: user?.email?.split("@")[0] || "Пользователь" 
        },
        timestamp
      }];
      
      // Prepare properly typed data for the API
      const taskData = {
        title: values.title,
        description: values.description,
        status: values.status,
        dueDate: values.dueDate.toISOString(),
        clientId: values.clientId === "none" ? undefined : values.clientId,
        projectId: values.projectId === "none" ? undefined : values.projectId,
        assigneeIds: values.assigneeIds,
        subtasks: validatedSubtasks,
        fileAttachments: values.fileAttachments ? values.fileAttachments.map(f => ({
          name: f.name || "",
          path: f.path || ""
        })) : undefined,
        comments: values.comments ? values.comments.map(c => ({
          text: c.text || "",
          author: {
            id: c.author?.id || "",
            name: c.author?.name || ""
          },
          timestamp: c.timestamp || timestamp
        })) : undefined,
        changeHistory: newChangeHistory.map(h => ({
          text: h.text || "",
          author: {
            id: h.author?.id || "",
            name: h.author?.name || ""
          },
          timestamp: h.timestamp || timestamp
        })),
        createdBy: user?.id || "",
      };
      
      const newTask = await addTask(taskData, token);
      
      // Send notifications to assigned users
      if (values.assigneeIds && values.assigneeIds.length > 0) {
        // Get client and project names for the notification
        const clientName = values.clientId && values.clientId !== "none" 
          ? clients.find(c => c.id === values.clientId)?.name || "Неизвестный клиент"
          : "Без клиента";
          
        const projectName = values.projectId && values.projectId !== "none"
          ? projects.find(p => p.id === values.projectId)?.name || "Неизвестный проект"
          : "Без проекта";
        
        // Notify each assigned user
        values.assigneeIds.forEach(userId => {
          // Don't notify the creator
          if (userId !== user?.id) {
            // Find user info for personalized notification
            const assignedUser = users.find(u => u.id === userId);
            if (assignedUser) {
              // Add notification to current user's context
              addNotification({
                type: "task_assignment",
                title: "Новое назначение задачи",
                message: `Вы были назначены на задачу "${values.title}" ${projectName !== "Без проекта" ? `для проекта "${projectName}"` : ''} ${clientName !== "Без клиента" ? `(клиент: ${clientName})` : ''}. Статус задачи: ${values.status}.`,
                entityId: newTask.id,
                entityType: "task",
                taskId: newTask.id
              });
              
              // Also send notification to the server for the assigned user
              // This ensures the notification persists and is visible when the assigned user logs in
              try {
                sendNotification(
                  userId, 
                  {
                    type: "task_assignment",
                    title: "Новое назначение задачи",
                    message: `Вы были назначены на задачу "${values.title}" ${projectName !== "Без проекта" ? `для проекта "${projectName}"` : ''} ${clientName !== "Без клиента" ? `(клиент: ${clientName})` : ''}. Статус задачи: ${values.status}.`,
                    entityId: newTask.id,
                    entityType: "task",
                    taskId: newTask.id
                  },
                  token
                );
              } catch (error) {
                console.error("Error sending notification to user:", error);
              }
            }
          }
        });
      }
      
      // Show success message
      toast.success("Задача успешно добавлена");
      
      // Update cache with the new task to make it appear immediately
      const currentTasks = queryClient.getQueryData<Task[]>(["enhanced-tasks"]) || [];
      queryClient.setQueryData(["enhanced-tasks"], [...currentTasks, newTask]);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-by-status"] });
      queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
      
      // Call onTaskCreated callback if provided
      if (onTaskCreated) {
        onTaskCreated();
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Ошибка при добавлении задачи");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новую задачу</DialogTitle>
          <DialogDescription>
            Заполните форму ниже, чтобы создать новую задачу
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Детали</TabsTrigger>
                <TabsTrigger value="subtasks">Подзадачи</TabsTrigger>
                <TabsTrigger value="attachments">Вложения</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название задачи</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название задачи" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введите описание задачи" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Срок выполнения</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>Выберите дату</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Client */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиент</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите клиента" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Нет</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Project */}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Проект</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={clientId === "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={clientId === "none" ? "Сначала выберите клиента" : "Выберите проект"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Нет</SelectItem>
                          {filteredProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Assignees */}
                <FormField
                  control={form.control}
                  name="assigneeIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Исполнители</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span>
                              {assigneeIds.length 
                                ? `Выбран исполнитель: ${users.find(u => u.id === assigneeIds[0])?.name || 'Пользователь'}` 
                                : "Выберите исполнителя"}
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
                                handleAssigneeChange(user.id, !!checked);
                              }}
                            >
                              <div className="flex items-center">
                                <UserAvatar user={user} size="sm" />
                                <span className="ml-2">{user.name || user.email}</span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {assigneeIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {assigneeIds.map(id => {
                            const selectedUser = users.find(u => u.id === id);
                            return selectedUser ? (
                              <div key={id} className="flex items-center bg-muted p-2 rounded-md">
                                <UserAvatar user={selectedUser} size="sm" />
                                <span className="ml-2">{selectedUser.name || selectedUser.email}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="subtasks" className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addSubtask}
                  className="mb-4"
                >
                  <Plus className="mr-2 h-4 w-4" /> Добавить подзадачу
                </Button>
                
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSubtaskCompletion(index)}
                    >
                      {subtask.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 border rounded-sm" />
                      )}
                    </Button>
                    <Input
                      value={subtask.title}
                      onChange={(e) => updateSubtaskTitle(index, e.target.value)}
                      placeholder="Название подзадачи"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {subtasks.length === 0 && (
                  <div className="text-center text-muted-foreground p-4">
                    Нет подзадач. Нажмите кнопку выше, чтобы добавить.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="attachments" className="space-y-4">
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-4"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Загрузить файлы
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                </div>
                
                {fileAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {fileAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    Нет вложений. Нажмите кнопку выше, чтобы добавить.
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="submit">Создать задачу</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
