
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTasksByStatus, getEnhancedTasks, users } from "@/lib/mock-data";
import TaskCard from "@/components/TaskCard";
import { ArrowRight, CheckCircle, Clock, Layers } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Status } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const Dashboard = () => {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const tasksByStatus = getTasksByStatus();
  const allTasks = getEnhancedTasks();
  const isMobile = useIsMobile();
  
  // Get the total count per status for the pie chart
  const statusCounts = [
    { name: "Черновик", value: tasksByStatus.draft.length, color: "#E2E8F0" },
    { name: "В процессе", value: tasksByStatus["in-progress"].length, color: "#93C5FD" },
    { name: "На проверке", value: tasksByStatus["under-review"].length, color: "#FDE68A" },
    { name: "Завершено", value: tasksByStatus.completed.length, color: "#86EFAC" },
    { name: "Отменено", value: tasksByStatus.canceled.length, color: "#FECACA" }
  ];
  
  // Get recent tasks
  const recentTasks = [...allTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
    
  // Get upcoming deadlines
  const today = new Date();
  const upcomingDeadlines = [...allTasks]
    .filter(task => new Date(task.dueDate) > today && task.status !== "completed" && task.status !== "canceled")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <MainLayout title="Дашборд">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base md:text-lg font-semibold">Всего задач</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{allTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Текущий месяц</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base md:text-lg font-semibold">В работе</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{tasksByStatus["in-progress"].length}</div>
            <p className="text-xs text-muted-foreground mt-1">Текущие задачи</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base md:text-lg font-semibold">Завершено</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{tasksByStatus.completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">За 30 дней</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base md:text-lg font-semibold">Команда</CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
                <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2 11.661 2 13.5C2 13.7071 2.16789 13.875 2.375 13.875C2.58211 13.875 2.75 13.7071 2.75 13.5C2.75 11.839 3.27784 10.7206 4.05093 9.96333C4.82093 9.20889 5.91612 8.875 7.5 8.875C9.08388 8.875 10.1791 9.20889 10.9491 9.96333C11.7222 10.7206 12.25 11.839 12.25 13.5C12.25 13.7071 12.4179 13.875 12.625 13.875C12.8321 13.875 13 13.7071 13 13.5C13 11.661 12.4778 10.2794 11.4959 9.31167C10.7244 8.55134 9.7003 8.12901 8.50627 7.98351C10.0188 7.54738 11.125 6.15288 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.625 4.5C4.625 2.91015 5.91015 1.625 7.5 1.625C9.08985 1.625 10.375 2.91015 10.375 4.5C10.375 6.08985 9.08985 7.375 7.5 7.375C5.91015 7.375 4.625 6.08985 4.625 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Сотрудников</p>
          </CardContent>
        </Card>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl font-semibold">Статус задач</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[300px]">
            <ChartContainer 
              config={{
                draft: { theme: { light: "#E2E8F0", dark: "#E2E8F0" }, label: "Черновик" },
                "in-progress": { theme: { light: "#93C5FD", dark: "#93C5FD" }, label: "В процессе" },
                "under-review": { theme: { light: "#FDE68A", dark: "#FDE68A" }, label: "На проверке" },
                completed: { theme: { light: "#86EFAC", dark: "#86EFAC" }, label: "Завершено" },
                canceled: { theme: { light: "#FECACA", dark: "#FECACA" }, label: "Отменено" },
              }}
              className="w-full h-full flex justify-center items-center"
            >
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 70 : 90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltipContent />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Recent Tasks */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold">Недавние задачи</CardTitle>
              <CardDescription>Последние обновленные задачи</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1" asChild>
              <a href="/tasks">
                Все задачи <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {recentTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Нет недавних задач</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <div className="mt-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold">Предстоящие дедлайны</CardTitle>
              <CardDescription>Ближайшие сроки выполнения</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1" asChild>
              <a href="/calendar">
                Календарь 
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                  <path d="M4.5 1C4.77614 1 5 1.22386 5 1.5V2H10V1.5C10 1.22386 10.2239 1 10.5 1C10.7761 1 11 1.22386 11 1.5V2H12.5C13.3284 2 14 2.67157 14 3.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V3.5C1 2.67157 1.67157 2 2.5 2H4V1.5C4 1.22386 4.22386 1 4.5 1ZM2.5 3C2.22386 3 2 3.22386 2 3.5V5H13V3.5C13 3.22386 12.7761 3 12.5 3H2.5ZM2 12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6H2V12.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-start space-x-3 border-b pb-3 last:border-0 rounded-md p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium line-clamp-1">{task.title}</p>
                      <StatusBadge status={task.status} className="text-[10px] ml-2" />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
              ))}
              
              {upcomingDeadlines.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Нет предстоящих дедлайнов</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
