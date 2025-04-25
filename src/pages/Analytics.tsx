import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, getClients, getEnhancedTasks } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Clock, AlertCircle, BarChart3, Users, Calendar as CalendarIconFull } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/UserAvatar";
import { Task, User, Client } from "@/lib/types";

type DateRange = 'all' | 'today' | 'week' | 'month';
type FilterState = {
  dateRange: DateRange;
  clientId: string | null;
  status: string | null;
  assigneeId: string | null;
  customDateFrom: Date | null;
  customDateTo: Date | null;
};

const Analytics = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("task-report");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    clientId: null,
    status: null,
    assigneeId: null,
    customDateFrom: null,
    customDateTo: null
  });

  // Fetch data
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: () => getEnhancedTasks(token),
    enabled: !!token
  });
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(token),
    enabled: !!token
  });
  
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(token),
    enabled: !!token
  });
  
  // Apply filters to tasks
  const filteredTasks = allTasks.filter((task: Task) => {
    // Date filter
    if (filters.dateRange !== 'all' || filters.customDateFrom || filters.customDateTo) {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt);
      
      if (filters.customDateFrom && filters.customDateTo) {
        // Custom date range
        if (!isWithinInterval(taskDate, {
          start: startOfDay(filters.customDateFrom),
          end: endOfDay(filters.customDateTo)
        })) {
          return false;
        }
      } else {
        // Predefined date ranges
        const now = new Date();
        let start: Date, end: Date;
        
        switch (filters.dateRange) {
          case 'today':
            start = startOfDay(now);
            end = endOfDay(now);
            break;
          case 'week':
            start = startOfWeek(now, { locale: ru });
            end = endOfWeek(now, { locale: ru });
            break;
          case 'month':
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
          default:
            start = new Date(0); // Beginning of time
            end = now;
        }
        
        if (!isWithinInterval(taskDate, { start, end })) {
          return false;
        }
      }
    }
    
    // Client filter
    if (filters.clientId && task.clientId !== filters.clientId) {
      return false;
    }
    
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Assignee filter
    if (filters.assigneeId && (!task.assigneeIds || !task.assigneeIds.includes(filters.assigneeId))) {
      return false;
    }
    
    return true;
  });
  
  // Calculate task statistics
  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(task => task.status === 'completed').length,
    inProgress: filteredTasks.filter(task => task.status === 'in-progress').length,
    underReview: filteredTasks.filter(task => task.status === 'under-review').length,
    draft: filteredTasks.filter(task => task.status === 'draft').length,
    canceled: filteredTasks.filter(task => task.status === 'canceled').length,
    overdue: filteredTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && task.status !== 'completed';
    }).length
  };
  
  // Calculate employee efficiency
  const employeeStats = users.map(user => {
    const userTasks = filteredTasks.filter(task => 
      task.assigneeIds && task.assigneeIds.includes(user.id)
    );
    
    const completedTasks = userTasks.filter(task => task.status === 'completed');
    const overdueTasks = userTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date() && task.status !== 'completed';
    });
    
    return {
      user,
      totalTasks: userTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0
    };
  }).sort((a, b) => b.completedTasks - a.completedTasks);
  
  if (tasksLoading || usersLoading || clientsLoading) {
    return (
      <MainLayout title="Аналитика">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Загрузка аналитики...</p>
        </div>
      </MainLayout>
    );
  }
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  // If not admin, show limited analytics
  if (!isAdmin) {
    return (
      <MainLayout title="Аналитика">
        <div className="container mx-auto py-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Всего задач</CardTitle>
                <CardDescription>Общее количество задач в системе</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{taskStats.total}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Завершено</CardTitle>
                <CardDescription>Задачи в статусе "Завершено"</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{taskStats.completed}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>В процессе</CardTitle>
                <CardDescription>Задачи в статусе "В процессе"</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{taskStats.inProgress}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Аналитика">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Аналитика</h1>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Date Range Filter */}
            <Select 
              value={filters.dateRange} 
              onValueChange={(value: DateRange) => setFilters({...filters, dateRange: value})}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Эта неделя</SelectItem>
                <SelectItem value="month">Этот месяц</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !filters.customDateFrom && !filters.customDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.customDateFrom && filters.customDateTo ? (
                    <>
                      {format(filters.customDateFrom, "dd.MM.yyyy")} - {format(filters.customDateTo, "dd.MM.yyyy")}
                    </>
                  ) : (
                    "Выберите даты"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.customDateFrom || undefined,
                    to: filters.customDateTo || undefined
                  }}
                  onSelect={(range) => {
                    setFilters({
                      ...filters, 
                      customDateFrom: range?.from || null,
                      customDateTo: range?.to || null,
                      dateRange: 'all' // Reset predefined range when custom range is selected
                    });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Client Filter */}
            <Select 
              value={filters.clientId || "all"} 
              onValueChange={(value) => setFilters({...filters, clientId: value === "all" ? null : value})}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Клиент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все клиенты</SelectItem>
                {clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select 
              value={filters.status || "all"} 
              onValueChange={(value) => setFilters({...filters, status: value === "all" ? null : value})}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="in-progress">В процессе</SelectItem>
                <SelectItem value="under-review">На проверке</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="canceled">Отменено</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Assignee Filter */}
            <Select 
              value={filters.assigneeId || "all"} 
              onValueChange={(value) => setFilters({...filters, assigneeId: value === "all" ? null : value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Исполнитель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все исполнители</SelectItem>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Reset Filters */}
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                dateRange: 'all',
                clientId: null,
                status: null,
                assigneeId: null,
                customDateFrom: null,
                customDateTo: null
              })}
            >
              Сбросить
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task-report" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Отчёт по задачам</span>
            </TabsTrigger>
            <TabsTrigger value="employee-report" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Эффективность сотрудников</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Task Report Tab */}
          <TabsContent value="task-report" className="space-y-6">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Всего задач</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{taskStats.total}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Завершено</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold">{taskStats.completed}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {taskStats.total > 0 ? 
                      `${Math.round((taskStats.completed / taskStats.total) * 100)}% от общего числа` : 
                      '0% от общего числа'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">В работе</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold">{taskStats.inProgress + taskStats.underReview}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {taskStats.total > 0 ? 
                      `${Math.round(((taskStats.inProgress + taskStats.underReview) / taskStats.total) * 100)}% от общего числа` : 
                      '0% от общего числа'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Просрочено</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="bg-red-100 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold">{taskStats.overdue}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {taskStats.total > 0 ? 
                      `${Math.round((taskStats.overdue / taskStats.total) * 100)}% от общего числа` : 
                      '0% от общего числа'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по статусам</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <span>Черновик</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{taskStats.draft}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-300 rounded-full" 
                            style={{ width: `${taskStats.total > 0 ? (taskStats.draft / taskStats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>В процессе</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{taskStats.inProgress}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>На проверке</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{taskStats.underReview}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full" 
                            style={{ width: `${taskStats.total > 0 ? (taskStats.underReview / taskStats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Завершено</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{taskStats.completed}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Отменено</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{taskStats.canceled}</span>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full" 
                            style={{ width: `${taskStats.total > 0 ? (taskStats.canceled / taskStats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Просроченные задачи</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {filteredTasks.filter(task => {
                    if (!task.dueDate) return false;
                    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
                  }).length > 0 ? (
                    <div className="space-y-2">
                      {filteredTasks.filter(task => {
                        if (!task.dueDate) return false;
                        return new Date(task.dueDate) < new Date() && task.status !== 'completed';
                      }).map(task => (
                        <div key={task.id} className="p-2 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Срок: {format(new Date(task.dueDate), "dd.MM.yyyy")}
                              </p>
                            </div>
                            <Badge variant="destructive">Просрочено</Badge>
                          </div>
                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex mt-2">
                              {task.assignees.slice(0, 3).map((assignee, index) => (
                                assignee && <UserAvatar key={`assignee-${task.id}-${index}`} user={assignee} size="sm" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Нет просроченных задач</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Employee Report Tab */}
          <TabsContent value="employee-report" className="space-y-6">
            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Эффективность сотрудников</CardTitle>
                  <CardDescription>
                    Статистика по выполненным задачам и эффективности
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeStats.length > 0 ? (
                      employeeStats.map((stat, index) => (
                        <div key={stat.user?.id || index} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            {stat.user && <UserAvatar user={stat.user} />}
                            <div>
                              <p className="font-medium">{stat.user?.name || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{stat.user?.email || 'No email'}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-3 md:mt-0">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Всего задач</p>
                              <p className="font-bold">{stat.totalTasks}</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Выполнено</p>
                              <p className="font-bold">{stat.completedTasks}</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Эффективность</p>
                              <div className="flex items-center justify-center gap-1">
                                <p className="font-bold">{Math.round(stat.completionRate)}%</p>
                                <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      stat.completionRate >= 70 ? "bg-green-500" :
                                      stat.completionRate >= 40 ? "bg-yellow-500" :
                                      "bg-red-500"
                                    )}
                                    style={{ width: `${stat.completionRate}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Нет данных о сотрудниках</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Analytics;
