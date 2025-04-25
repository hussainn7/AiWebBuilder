import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { addProject, getUsers, sendNotification } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { getClients } from "@/lib/api-utils";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

const projectSchema = z.object({
  name: z.string().min(1, "Название проекта обязательно"),
  description: z.string().min(1, "Описание обязательно"),
  clientId: z.string().min(1, "Клиент обязателен"),
  status: z.enum(["active", "completed", "on-hold"]),
  startDate: z.date(),
  endDate: z.date().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectForm({ open, onOpenChange }: ProjectFormProps) {
  const queryClient = useQueryClient();
  const { user, token, addNotification } = useAuth();
  const [usersCommandOpen, setUsersCommandOpen] = React.useState(false);
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(token || ""),
    enabled: !!token
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(token),
    enabled: !!token
  });
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      status: "active",
      startDate: new Date(),
      assignedUserIds: [], // Initialize as empty array
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  async function onSubmit(values: ProjectFormValues) {
    try {
      const newProject = await addProject({
        name: values.name,
        description: values.description,
        clientId: values.clientId,
        status: values.status,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        createdBy: user?.id || "",
        assignedUserIds: Array.isArray(values.assignedUserIds) ? values.assignedUserIds : [],
      }, token || "");
      
      // Notify assigned users
      if (values.assignedUserIds && values.assignedUserIds.length > 0) {
        const clientName = clients.find(c => c.id === values.clientId)?.name || "Unknown Client";
        
        values.assignedUserIds.forEach(userId => {
          const assignedUser = users.find(u => u.id === userId);
          
          if (assignedUser) {
            // Add client-side notification
            addNotification({
              type: "project_assignment",
              title: "Новое назначение на проект",
              message: `Вы были назначены на проект "${values.name}" для клиента "${clientName}". Вы можете просматривать детали проекта, но только создатель проекта или администратор может редактировать его.`,
              entityId: newProject.id,
              entityType: "project",
              projectId: newProject.id
            });
            
            // Send server-side notification
            try {
              const notification = {
                type: "project_assignment",
                title: "Новое назначение на проект",
                message: `Вы были назначены на проект "${values.name}" для клиента "${clientName}". Вы можете просматривать детали проекта, но только создатель проекта или администратор может редактировать его.`,
                entityId: newProject.id,
                entityType: "project",
                projectId: newProject.id
              };
              
              sendNotification(userId, notification, token || '');
            } catch (error) {
              console.error("Error sending notification to user:", error);
            }
          }
        });
      }
      
      toast.success("Проект успешно добавлен");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-with-clients"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Ошибка при добавлении проекта");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="project-form-description">
        <DialogHeader>
          <DialogTitle>Добавить проект</DialogTitle>
          <p id="project-form-description" className="text-sm text-muted-foreground">
            Заполните форму для создания нового проекта
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название проекта" {...field} />
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
                    <Textarea placeholder="Описание проекта" {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Клиент</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name="assignedUserIds"
              render={({ field }) => {
                // Ensure field.value is always an array
                const fieldValue = Array.isArray(field.value) ? field.value : [];
                
                return (
                <FormItem className="flex flex-col">
                  <FormLabel>Назначить пользователей</FormLabel>
                  <FormControl>
                    <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
                      {users.length === 0 ? (
                        <div className="text-muted-foreground">Нет доступных пользователей</div>
                      ) : (
                        users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`user-${user.id}`}
                              checked={fieldValue.includes(user.id)}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...fieldValue, user.id]
                                  : fieldValue.filter((id) => id !== user.id);
                                field.onChange(newValues);
                              }}
                            />
                            <label 
                              htmlFor={`user-${user.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {user.name} ({user.email})
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1">
                    {fieldValue.length > 0 
                      ? `Выбрано пользователей: ${fieldValue.length}` 
                      : "Выберите пользователей для назначения на проект"}
                  </div>
                  <FormMessage />
                </FormItem>
              )}}
            />
            
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
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="completed">Завершен</SelectItem>
                      <SelectItem value="on-hold">На паузе</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Дата начала</FormLabel>
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
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Дата окончания (опционально)</FormLabel>
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
                          selected={field.value || undefined}
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
