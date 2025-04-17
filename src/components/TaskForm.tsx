
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTask } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { getClients, getProjects, getUsers } from "@/lib/api-utils";
import { Status } from "@/lib/types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";

const statusOptions: { value: Status; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "in-progress", label: "В процессе" },
  { value: "under-review", label: "На проверке" },
  { value: "completed", label: "Завершено" },
  { value: "canceled", label: "Отменено" }
];

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
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskForm({ open, onOpenChange }: TaskFormProps) {
  const queryClient = useQueryClient();
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
      dueDate: new Date(),
      clientId: "",
      projectId: "",
      assigneeIds: [],
      subtasks: [],
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

  async function onSubmit(values: TaskFormValues) {
    try {
      await addTask({
        title: values.title,
        description: values.description,
        status: values.status,
        dueDate: values.dueDate.toISOString(),
        clientId: values.clientId || undefined,
        projectId: values.projectId || undefined,
        assigneeIds: values.assigneeIds,
        subtasks: values.subtasks,
      });
      
      toast.success("Задача успешно добавлена");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Ошибка при добавлении задачи");
    }
  }

  const selectedAssigneeIds = form.watch("assigneeIds") || [];
  const selectedAssignees = users.filter(user => selectedAssigneeIds.includes(user.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить задачу</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
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
                  <FormLabel>Описание</FormLabel>
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
                    <FormLabel>Статус</FormLabel>
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
                    <FormLabel>Срок выполнения</FormLabel>
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
                    <FormLabel>Клиент (опционально)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("projectId", ""); // Reset project when client changes
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Не выбран</SelectItem>
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
                    <FormLabel>Проект (опционально)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClientId ? "Выберите проект" : "Сначала выберите клиента"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Не выбран</SelectItem>
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
                        {users.map((user) => (
                          <DropdownMenuCheckboxItem
                            key={user.id}
                            checked={selectedAssigneeIds.includes(user.id)}
                            onCheckedChange={(checked) => {
                              const updatedIds = checked
                                ? [...selectedAssigneeIds, user.id]
                                : selectedAssigneeIds.filter(id => id !== user.id);
                              field.onChange(updatedIds);
                            }}
                            className="flex items-center gap-2"
                          >
                            <UserAvatar user={user} size="sm" />
                            {user.name}
                          </DropdownMenuCheckboxItem>
                        ))}
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
