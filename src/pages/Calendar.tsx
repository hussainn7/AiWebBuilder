
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEnhancedTasks } from "@/lib/api-utils";
import { format, isSameDay, isSameMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import UserAvatarGroup from "@/components/UserAvatarGroup";
import { useQuery } from "@tanstack/react-query";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [filter, setFilter] = useState<"all" | "my">("all");

  const { data: allTasks = [] } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: getEnhancedTasks
  });
  
  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return (allTasks as Task[]).filter(task => {
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, date);
    });
  };

  // Get tasks for the selected date
  const tasksForSelectedDate = getTasksForDate(selectedDate);

  return (
    <MainLayout title="Календарь">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Calendar */}
        <div className="col-span-1">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Календарь</h3>
              <Select defaultValue={filter} onValueChange={(value) => setFilter(value as "all" | "my")}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Все задачи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все задачи</SelectItem>
                  <SelectItem value="my">Мои задачи</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={ru}
              modifiers={{
                hasTasks: (date: Date) => {
                  return (allTasks as Task[]).some(task => {
                    const taskDate = new Date(task.dueDate);
                    return isSameDay(taskDate, date) && isSameMonth(date, selectedDate);
                  });
                },
              }}
              modifiersStyles={{
                hasTasks: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
              }}
            />
          </Card>
        </div>
        
        {/* Right Panel - Tasks */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">
                  {format(selectedDate, "d MMMM yyyy", { locale: ru })}
                </h2>
                <Tabs defaultValue="month" value={view} onValueChange={(value) => setView(value as "month" | "week")}>
                  <TabsList>
                    <TabsTrigger value="month">Месяц</TabsTrigger>
                    <TabsTrigger value="week">Неделя</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="space-y-4">
              {tasksForSelectedDate.length > 0 ? (
                tasksForSelectedDate.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium mb-1">{task.title}</h3>
                        {task.client && (
                          <p className="text-sm text-muted-foreground">
                            {task.client.name}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <UserAvatarGroup users={task.assignees} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Нет задач на выбранную дату</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Calendar;
