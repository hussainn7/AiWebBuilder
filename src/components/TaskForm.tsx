import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, MessageSquare, History, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTask } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { getClients, getProjects, getUsers } from "@/lib/api-utils";
import { Status, User } from "@/lib/types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

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
}

export function TaskForm({ open, onOpenChange }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(token),
    enabled: !!token
  });
  
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(token),
    enabled: !!token
  });
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(token),
    enabled: !!token
  });
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      dueDate: new Date(),
      clientId: "none",
      projectId: "none",
      assigneeIds: [],
      subtasks: [],
      fileAttachments: [],
      comments: [],
      changeHistory: [],
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  // Filter projects based on selected client
  const selectedClientId = form.watch("clientId");
  const filteredProjects = selectedClientId 
    ? projects.filter(project => project.clientId === selectedClientId)
    : projects;

  // Add new subtask
  const addSubtask = () => {
    const currentSubtasks = form.getValues("subtasks") || [];
    form.setValue("subtasks", [...currentSubtasks, { title: "", completed: false }]);
  };

  // Remove subtask
  const removeSubtask = (index: number) => {
    const currentSubtasks = form.getValues("subtasks") || [];
    form.setValue("subtasks", currentSubtasks.filter((_, i) => i !== index));
  };

  // Add new comment
  const addComment = () => {
    const currentComments = form.getValues("comments") || [];
    const timestamp = new Date().toISOString();
    form.setValue("comments", [...currentComments, { 
      text: "", 
      author: { 
        id: user?.id?.toString() || "unknown", 
        name: user?.email?.split("@")[0] || "Пользователь" 
      },
      timestamp
    }]);
  };

  // Remove comment
  const removeComment = (index: number) => {
    const currentComments = form.getValues("comments") || [];
    form.setValue("comments", currentComments.filter((_, i) => i !== index));
  };

  // Upload file
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Just store the file name locally without actually uploading
      const currentFileAttachments = form.getValues("fileAttachments") || [];
      form.setValue("fileAttachments", [...currentFileAttachments, { 
        name: file.name, 
        path: `/uploads/${file.name}` // This is just a mock path
      }]);
      toast.success("Файл успешно добавлен");
    } catch (error) {
      console.error("Error adding file:", error);
      toast.error("Ошибка при добавлении файла");
    }
  };

  // Remove change history watch to prevent too many entries
  useEffect(() => {
    // We'll only add change history on submit instead of on every change
    return () => {};
  }, [form, user]);

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
      
      await addTask({
        title: values.title,
        description: values.description,
        status: values.status,
        dueDate: values.dueDate.toISOString(),
        clientId: values.clientId === "none" ? undefined : values.clientId,
        projectId: values.projectId === "none" ? undefined : values.projectId,
        assigneeIds: values.assigneeIds,
        subtasks: validatedSubtasks,
        fileAttachments: values.fileAttachments,
        comments: values.comments,
        changeHistory: newChangeHistory,
      });
      
      toast.success("Задача успешно добавлена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-by-status"] });
      queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Ошибка при добавлении задачи");
    }
  }

  // Get selected assignees
  const selectedAssigneeIds = form.watch("assigneeIds");
  const selectedAssignees = users.filter(user => 
    selectedAssigneeIds.includes(user.id)
  );

  // Loading and empty states for users dropdown
  const hasUsers = users.length > 0;
  const userContent = () => {
    if (usersLoading) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Загрузка пользователей...
        </div>
      );
    }
    
    if (!hasUsers) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Нет доступных пользователей
        </div>
      );
    }
    
    return users.map((user) => (
      <DropdownMenuCheckboxItem
        key={user.id}
        checked={selectedAssigneeIds.includes(user.id)}
        onCheckedChange={(checked) => {
          const updatedIds = checked
            ? [...selectedAssigneeIds, user.id]
            : selectedAssigneeIds.filter(id => id !== user.id);
          form.setValue("assigneeIds", updatedIds);
        }}
        className="flex items-center gap-2"
      >
        <UserAvatar user={user} size="sm" />
        {user.name}
      </DropdownMenuCheckboxItem>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить задачу</DialogTitle>
          <DialogDescription>Введите необходимую информацию о задаче</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название задачи</FormLabel>
                  <FormControl>
                    <Input placeholder="Название задачи" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание задачи</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Описание задачи" {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус задачи</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок выполнения задачи</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                            <CalendarIcon className="ml-auto h-4 w-4" />
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Клиент</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("projectId", "none"); // Reset project when client changes
                      }} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Не выбран</SelectItem>
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
              
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Проект</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "none"}
                      disabled={!selectedClientId || selectedClientId === "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClientId && selectedClientId !== "none" ? "Выберите проект" : "Сначала выберите клиента"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Не выбран</SelectItem>
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
            </div>
            
            <FormField
              control={form.control}
              name="assigneeIds"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Исполнители</FormLabel>
                    {selectedAssignees.length > 0 && (
                      <div className="flex -space-x-2">
                        {selectedAssignees.slice(0, 3).map((user) => (
                          <UserAvatar key={user.id} user={user} size="sm" />
                        ))}
                        {selectedAssignees.length > 3 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs text-muted-foreground">
                            +{selectedAssignees.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          Выбрать исполнителей
                          <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                            {selectedAssigneeIds.length}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 max-h-[300px] overflow-auto">
                        {userContent()}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Подзадачи</h3>
                <Button type="button" size="sm" variant="outline" onClick={addSubtask}>
                  <Plus className="h-4 w-4 mr-1" /> Добавить подзадачу
                </Button>
              </div>
              
              {form.watch("subtasks").map((_, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`subtasks.${index}.title`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Название подзадачи" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => removeSubtask(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Файловые вложения</h3>
                <Button type="button" size="sm" variant="outline" onClick={handleFileButtonClick}>
                  <Upload className="h-4 w-4 mr-1" /> Загрузить файл
                  <input type="file" ref={fileInputRef} onChange={uploadFile} hidden />
                </Button>
              </div>
              
              {form.watch("fileAttachments").map((file, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{file.name}</span>
                  <Button type="button" size="icon" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Комментарии</h3>
                <Button type="button" size="sm" variant="outline" onClick={addComment}>
                  <MessageSquare className="h-4 w-4 mr-1" /> Добавить комментарий
                </Button>
              </div>
              
              {form.watch("comments").map((comment, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Textarea value={comment.text} readOnly />
                  <Button type="button" size="icon" variant="outline" onClick={() => removeComment(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Textarea 
                    value={comment.text} 
                    onChange={(e) => {
                      const currentComments = form.getValues("comments") || [];
                      currentComments[index].text = e.target.value;
                      form.setValue("comments", currentComments);
                    }} 
                  />
                </div>
              ))}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">История изменений</h3>
              </div>
              
              {form.watch("changeHistory").map((record, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <Textarea value={record.text} readOnly />
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit">Добавить</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
