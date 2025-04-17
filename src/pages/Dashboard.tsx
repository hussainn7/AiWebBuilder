
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTasksByStatus, getEnhancedTasks, users } from "@/lib/mock-data";
import TaskCard from "@/components/TaskCard";
import UserAvatar from "@/components/UserAvatar";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowRight, BarChart3, Calendar, CheckCircle, CircleDashed, Clock, Layers, Users } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Status } from "@/lib/types";

const Dashboard = () => {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const tasksByStatus = getTasksByStatus();
  const allTasks = getEnhancedTasks();
  
  // Get the total count per status for the pie chart
  const statusCounts = [
    { name: "Черновик", value: tasksByStatus.draft.length, color: "#E2E8F0" },
    { name: "В процессе", value: tasksByStatus["in-progress"].length, color: "#93C5FD" },
    { name: "На проверке", value: tasksByStatus["under-review"].length, color: "#FDE68A" },
    { name: "Завершено", value: tasksByStatus.completed.length, color: "#86EFAC" },
    { name: "Отменено", value: tasksByStatus.canceled.length, color: "#FECACA" }
  ];
  
  const statusConfig = {
    draft: { icon: CircleDashed, color: "#E2E8F0" },
    "in-progress": { icon: Clock, color: "#93C5FD" },
    "under-review": { icon: Layers, color: "#FDE68A" },
    completed: { icon: CheckCircle, color: "#86EFAC" },
    canceled: { icon: CircleDashed, color: "#FECACA" }
  };
  
  // Get workload per user for the bar chart
  const userWorkload = users.map(user => {
    const assignedTasks = allTasks.filter(task => 
      task.assignees.some(assignee => assignee.id === user.id)
    );
    
    return {
      name: user.name.split(" ")[0],
      tasks: assignedTasks.length,
      completed: assignedTasks.filter(task => task.status === "completed").length
    };
  }).sort((a, b) => b.tasks - a.tasks).slice(0, 7);
  
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

  const getStatusCounts = () => {
    return Object.entries(tasksByStatus).map(([status, tasks]) => ({
      status: status as Status,
      count: tasks.length,
    }));
  };

  return (
    <MainLayout title="Дашборд">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">Всего задач</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Текущий месяц</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">В работе</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasksByStatus["in-progress"].length}</div>
            <p className="text-xs text-muted-foreground mt-1">Текущие активные задачи</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">Завершено</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasksByStatus.completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">За последние 30 дней</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">Команда</CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Активных сотрудников</p>
          </CardContent>
        </Card>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team workload chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Нагрузка команды</CardTitle>
                <CardDescription>Распределение задач между сотрудниками</CardDescription>
              </div>
              <Tabs defaultValue="week" className="mt-2">
                <TabsList className="grid grid-cols-3 w-[200px]">
                  <TabsTrigger value="day" onClick={() => setPeriod("day")}>День</TabsTrigger>
                  <TabsTrigger value="week" onClick={() => setPeriod("week")}>Неделя</TabsTrigger>
                  <TabsTrigger value="month" onClick={() => setPeriod("month")}>Месяц</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer 
              config={{
                tasks: { theme: { light: "#93C5FD", dark: "#93C5FD" }, label: "Всего задач" },
                completed: { theme: { light: "#86EFAC", dark: "#86EFAC" }, label: "Завершено" },
              }}
              className="w-full h-full"
            >
              <BarChart data={userWorkload} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tasks" name="tasks" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Status chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">Статус задач</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltipContent />} />
                <Legend 
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={10}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Недавние задачи</CardTitle>
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
        
        {/* Upcoming Deadlines */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Предстоящие дедлайны</CardTitle>
              <CardDescription>Ближайшие сроки выполнения</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1" asChild>
              <a href="/calendar">
                Календарь <Calendar className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 2).map((user) => (
                      <UserAvatar key={user.id} user={user} size="sm" className="-mr-2" />
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                        +{task.assignees.length - 2}
                      </div>
                    )}
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

      {/* Task status overview */}
      <div className="mt-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Обзор статусов</CardTitle>
                <CardDescription>Количество задач по статусам</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/tasks">
                  <BarChart3 className="mr-2 h-4 w-4" /> Подробная аналитика
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {getStatusCounts().map(item => {
                const StatusIcon = statusConfig[item.status].icon;
                return (
                  <Card key={item.status} className="border-none shadow-none bg-muted/40">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                        style={{ backgroundColor: `${statusConfig[item.status].color}30` }}
                      >
                        <StatusIcon className="w-5 h-5" style={{ color: statusConfig[item.status].color }} />
                      </div>
                      <p className="text-sm font-medium mb-1">
                        <StatusBadge status={item.status} />
                      </p>
                      <p className="text-2xl font-bold">{item.count}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
