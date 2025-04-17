
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTasksByStatus, getEnhancedTasks, users } from "@/lib/mock-data";
import TaskCard from "@/components/TaskCard";
import UserAvatar from "@/components/UserAvatar";

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
  });
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Всего задач</CardTitle>
            <CardDescription>Общее количество задач</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allTasks.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">В работе</CardTitle>
            <CardDescription>Задачи в процессе выполнения</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasksByStatus["in-progress"].length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Завершено</CardTitle>
            <CardDescription>Выполненные задачи</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasksByStatus.completed.length}</div>
          </CardContent>
        </Card>
        
        {/* Charts */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Нагрузка команды</CardTitle>
            <CardDescription>Распределение задач между сотрудниками</CardDescription>
            <Tabs defaultValue="week" className="mt-2">
              <TabsList className="grid grid-cols-3 w-[200px]">
                <TabsTrigger value="day" onClick={() => setPeriod("day")}>День</TabsTrigger>
                <TabsTrigger value="week" onClick={() => setPeriod("week")}>Неделя</TabsTrigger>
                <TabsTrigger value="month" onClick={() => setPeriod("month")}>Месяц</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tasks" name="Всего задач" fill="#93C5FD" />
                <Bar dataKey="completed" name="Завершено" fill="#86EFAC" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статус задач</CardTitle>
            <CardDescription>Распределение по статусам</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Недавние задачи</CardTitle>
            <CardDescription>Последние обновленные задачи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
        
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Предстоящие дедлайны</CardTitle>
            <CardDescription>Ближайшие сроки выполнения</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
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
                <p className="text-muted-foreground text-center py-3">Нет предстоящих дедлайнов</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
