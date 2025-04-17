
import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { getEnhancedTasks, users, clients } from "@/lib/mock-data";
import { format, subDays, subMonths } from "date-fns";

const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [selectedMetric, setSelectedMetric] = useState<"tasks" | "users" | "clients">("tasks");

  const allTasks = getEnhancedTasks();
  
  // Mock data for task completion over time
  const generateTaskCompletionData = () => {
    const numberOfPoints = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 90;
    const data = [];
    
    for (let i = 0; i < numberOfPoints; i++) {
      const date = timeRange === "week" 
        ? subDays(new Date(), i)
        : timeRange === "month"
          ? subDays(new Date(), i)
          : subDays(new Date(), i);
      
      const formattedDate = format(date, "dd.MM");
      
      // Simulated data
      const completed = Math.floor(Math.random() * 5);
      const created = Math.floor(Math.random() * 7);
      
      data.unshift({
        date: formattedDate,
        completed,
        created
      });
    }
    
    return data;
  };
  
  // Data for task status distribution
  const taskStatusData = [
    { name: "Черновик", value: allTasks.filter(t => t.status === "draft").length },
    { name: "В процессе", value: allTasks.filter(t => t.status === "in-progress").length },
    { name: "На проверке", value: allTasks.filter(t => t.status === "under-review").length },
    { name: "Завершено", value: allTasks.filter(t => t.status === "completed").length },
    { name: "Отменено", value: allTasks.filter(t => t.status === "canceled").length },
  ];
  
  // Data for employee performance
  const employeePerformanceData = users.map(user => {
    const assignedTasks = allTasks.filter(task => 
      task.assignees.some(assignee => assignee.id === user.id)
    );
    
    const completedTasks = assignedTasks.filter(task => task.status === "completed");
    
    return {
      name: user.name.split(" ")[0],
      assigned: assignedTasks.length,
      completed: completedTasks.length,
      rate: assignedTasks.length ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0
    };
  });
  
  // Data for client task distribution
  const clientTaskData = clients.map(client => {
    const clientTasks = allTasks.filter(task => task.clientId === client.id);
    
    return {
      name: client.name,
      tasks: clientTasks.length
    };
  });

  return (
    <MainLayout title="Аналитика">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs 
          defaultValue="tasks" 
          className="w-full sm:w-auto"
          onValueChange={(value) => setSelectedMetric(value as any)}
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="users">Сотрудники</TabsTrigger>
            <TabsTrigger value="clients">Клиенты</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <TabsContent value="tasks" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Динамика задач</CardTitle>
              <CardDescription>Создание и выполнение задач со временем</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateTaskCompletionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Создано" stroke="#8884d8" />
                  <Line type="monotone" dataKey="completed" name="Выполнено" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Распределение по статусам</CardTitle>
              <CardDescription>Текущее состояние задач</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="users" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Эффективность сотрудников</CardTitle>
              <CardDescription>Назначенные и выполненные задачи</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={employeePerformanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" name="Назначено" fill="#8884d8" />
                  <Bar dataKey="completed" name="Выполнено" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="clients" className="mt-0">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Распределение задач по клиентам</CardTitle>
              <CardDescription>Количество задач для каждого клиента</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={clientTaskData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="tasks" name="Задачи" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </MainLayout>
  );
};

export default Analytics;
