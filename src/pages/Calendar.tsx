import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getCalendarEvents, getEnhancedTasks, getProjects } from "@/lib/api-utils";
import { format, isSameDay, isSameMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { Task, Project } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import UserAvatarGroup from "@/components/UserAvatarGroup";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  type?: 'task' | 'project';
}

const Calendar = () => {
  const { token } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [filter, setFilter] = useState<"all" | "my" | "projects">("all");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => getCalendarEvents(token),
    enabled: !!token
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: () => getEnhancedTasks(token),
    enabled: !!token
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(token),
    enabled: !!token
  });
  
  // Combine tasks and project deadlines into a single events array
  const combinedEvents: CalendarEvent[] = [
    ...events.map((event: any) => ({
      ...event,
      type: 'task' as const
    })),
    ...projects.map((project: Project) => ({
      id: `project-${project.id}`,
      title: `Проект: ${project.name}`,
      start: project.startDate,
      end: project.endDate || project.startDate,
      status: project.status,
      type: 'project' as const
    }))
  ];
  
  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return isSameDay(dueDate, date);
    });
  };

  // Get projects for a specific date (either start or end date)
  const getProjectsForDate = (date: Date): Project[] => {
    return projects.filter(project => {
      if (!project.startDate) return false;
      const startDate = new Date(project.startDate);
      const endDate = project.endDate ? new Date(project.endDate) : null;
      
      return isSameDay(startDate, date) || (endDate && isSameDay(endDate, date));
    });
  };

  // Get tasks for the selected date
  const tasksForSelectedDate = getTasksForDate(selectedDate);
  
  // Get projects for the selected date
  const projectsForSelectedDate = getProjectsForDate(selectedDate);

  if (eventsLoading || tasksLoading || projectsLoading) {
    return (
      <MainLayout title="Календарь">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Загрузка календаря...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Календарь">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Calendar */}
        <div className="col-span-1">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Календарь</h3>
              <Select defaultValue={filter} onValueChange={(value) => setFilter(value as "all" | "my" | "projects")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все задачи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все задачи</SelectItem>
                  <SelectItem value="my">Мои задачи</SelectItem>
                  <SelectItem value="projects">Проекты</SelectItem>
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
                hasEvents: (date: Date) => {
                  return combinedEvents.some(event => {
                    const eventDate = new Date(event.start);
                    const eventEndDate = event.end ? new Date(event.end) : null;
                    return (
                      (isSameDay(eventDate, date) || (eventEndDate && isSameDay(eventEndDate, date))) && 
                      isSameMonth(date, selectedDate) &&
                      (filter === "all" || 
                       (filter === "projects" && event.type === 'project') ||
                       (filter === "my" && event.type !== 'project'))
                    );
                  });
                },
              }}
              modifiersStyles={{
                hasEvents: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
              }}
            />
          </Card>
        </div>

        {/* Right Panel - Events for selected date */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                {format(selectedDate, "d MMMM yyyy", { locale: ru })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tasksForSelectedDate.length} задач и {projectsForSelectedDate.length} проектов на этот день
              </p>
            </div>

            <Tabs defaultValue="tasks">
              <TabsList className="mb-4">
                <TabsTrigger value="tasks">Задачи</TabsTrigger>
                <TabsTrigger value="projects">Проекты</TabsTrigger>
              </TabsList>

              {/* Tasks Tab */}
              <TabsContent value="tasks">
                <div className={tasksForSelectedDate.length === 0 ? "py-8 text-center" : "space-y-4"}>
                  {tasksForSelectedDate.length === 0 ? (
                    <p className="text-muted-foreground">Нет задач на этот день</p>
                  ) : (
                    tasksForSelectedDate.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center gap-2">
                            <UserAvatarGroup users={task.assignees} max={3} />
                          </div>
                          
                          {task.client && (
                            <span className="text-xs text-muted-foreground">
                              Клиент: {task.client.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <div className={projectsForSelectedDate.length === 0 ? "py-8 text-center" : "space-y-4"}>
                  {projectsForSelectedDate.length === 0 ? (
                    <p className="text-muted-foreground">Нет проектов на этот день</p>
                  ) : (
                    projectsForSelectedDate.map((project) => {
                      const isStartDate = isSameDay(new Date(project.startDate), selectedDate);
                      const isEndDate = project.endDate && isSameDay(new Date(project.endDate), selectedDate);
                      
                      return (
                        <div key={project.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{project.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                              <div className="mt-2">
                                {isStartDate && (
                                  <Badge variant="outline" className="mr-2 bg-blue-50">
                                    Начало проекта
                                  </Badge>
                                )}
                                {isEndDate && (
                                  <Badge variant="outline" className="bg-green-50">
                                    Завершение проекта
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant={project.status === 'active' ? 'default' : 
                                          project.status === 'completed' ? 'secondary' : 'outline'}>
                              {project.status === 'active' ? 'Активный' : 
                               project.status === 'completed' ? 'Завершен' : 'На паузе'}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Начало: {format(new Date(project.startDate), "d MMM yyyy", { locale: ru })}</span>
                              {project.endDate && (
                                <span>Конец: {format(new Date(project.endDate), "d MMM yyyy", { locale: ru })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Calendar;
