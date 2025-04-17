
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getEnhancedTasks } from "@/lib/mock-data";
import { format, isSameDay, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, subDays, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Task } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import UserAvatarGroup from "@/components/UserAvatarGroup";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [filter, setFilter] = useState<"all" | "my">("all");
  const isMobile = useIsMobile();
  
  const allTasks = getEnhancedTasks();
  
  // Helper function to get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return allTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, date);
    });
  };
  
  // Get tasks for the selected date
  const tasksForSelectedDate = getTasksForDate(selectedDate);
  
  // Get the week dates for weekly view
  const weekDates = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });
  
  // Functions to navigate between weeks
  const prevWeek = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };
  
  const nextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };
  
  // Format week range for display
  const formatWeekRange = () => {
    const start = format(weekDates[0], 'd MMMM', { locale: ru });
    const end = format(weekDates[6], 'd MMMM yyyy', { locale: ru });
    return `${start} - ${end}`;
  };

  return (
    <MainLayout title="Календарь">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <div className="col-span-1">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Календарь</h3>
              <Select defaultValue={filter} onValueChange={(value) => setFilter(value as "all" | "my")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
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
                  return allTasks.some(task => {
                    const taskDate = new Date(task.dueDate);
                    return isSameDay(taskDate, date);
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
        
        {/* Tasks for selected date/week */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Tabs defaultValue={view} onValueChange={(value) => setView(value as "month" | "week")}>
                <TabsList>
                  <TabsTrigger value="month">Месяц</TabsTrigger>
                  <TabsTrigger value="week">Неделя</TabsTrigger>
                </TabsList>
              
                {view === "week" && (
                  <div className="flex items-center gap-2 ml-4">
                    <button 
                      onClick={prevWeek} 
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <span className="text-sm font-medium">
                      {formatWeekRange()}
                    </span>
                    
                    <button 
                      onClick={nextWeek} 
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              
                <TabsContent value="month">
                  <div>
                    <h3 className="font-medium mb-4">
                      {format(selectedDate, "d MMMM yyyy", { locale: ru })}
                    </h3>
                    
                    {tasksForSelectedDate.length > 0 ? (
                      <div className="space-y-3">
                        {tasksForSelectedDate.map((task) => (
                          <div key={task.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <StatusBadge status={task.status} />
                            </div>
                            
                            {task.client && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.client.name}
                              </p>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <UserAvatarGroup users={task.assignees} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Нет задач на выбранную дату</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="week">
                  <div className="overflow-x-auto">
                    <div className={`grid gap-2 min-w-[${isMobile ? "100%" : "800px"}] ${isMobile ? "grid-cols-1" : "grid-cols-7"}`}>
                      {isMobile ? (
                        // Mobile view - show only current day
                        <div 
                          className={`border rounded-lg p-2 ${
                            isSameDay(selectedDate, new Date()) ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="text-center p-1 mb-2 font-medium">
                            <div className="text-sm">
                              {format(selectedDate, "EEEE, d MMMM", { locale: ru })}
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            {getTasksForDate(selectedDate).map((task) => (
                              <div 
                                key={task.id} 
                                className="p-2 rounded bg-secondary truncate cursor-pointer hover:bg-secondary/80 transition-colors"
                              >
                                <div className="font-medium">{task.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  <StatusBadge status={task.status} />
                                </div>
                              </div>
                            ))}
                            
                            {getTasksForDate(selectedDate).length === 0 && (
                              <div className="text-center py-4">
                                <p className="text-muted-foreground">Нет задач на этот день</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Desktop view - show full week
                        weekDates.map((date) => (
                          <div 
                            key={date.toString()}
                            className={`border rounded-lg p-2 ${
                              isSameDay(date, new Date()) ? "bg-primary/10" : ""
                            } ${
                              !isSameMonth(date, selectedDate) ? "opacity-50" : ""
                            }`}
                          >
                            <div className="text-center p-1 mb-2 font-medium">
                              <div className="text-xs text-muted-foreground">
                                {format(date, "EEEE", { locale: ru })}
                              </div>
                              <div>
                                {format(date, "d", { locale: ru })}
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              {getTasksForDate(date).map((task) => (
                                <div 
                                  key={task.id} 
                                  className="text-xs p-1 rounded bg-secondary truncate cursor-pointer hover:bg-secondary/80 transition-colors"
                                >
                                  {task.title}
                                </div>
                              ))}
                              
                              {getTasksForDate(date).length === 0 && (
                                <div className="text-center py-2">
                                  <p className="text-xs text-muted-foreground">Нет задач</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Calendar;
