import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTasks } from "@/lib/api-utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const Analytics = () => {
  const { token } = useAuth();

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(token),
    enabled: !!token
  });
  
  if (isLoading) {
    return (
      <MainLayout title="Аналитика">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Загрузка аналитики...</p>
        </div>
      </MainLayout>
    );
  }

  // Count tasks by status
  const taskCounts = {
    draft: allTasks.filter(task => task.status === 'draft').length,
    inProgress: allTasks.filter(task => task.status === 'in-progress').length,
    underReview: allTasks.filter(task => task.status === 'under-review').length,
    completed: allTasks.filter(task => task.status === 'completed').length,
    canceled: allTasks.filter(task => task.status === 'canceled').length,
    total: allTasks.length
  };

  return (
    <MainLayout title="Аналитика">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Всего задач</CardTitle>
            <CardDescription>Общее количество задач в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Черновики</CardTitle>
            <CardDescription>Задачи в статусе "Черновик"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.draft}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>В процессе</CardTitle>
            <CardDescription>Задачи в статусе "В процессе"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.inProgress}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>На проверке</CardTitle>
            <CardDescription>Задачи в статусе "На проверке"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.underReview}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Завершено</CardTitle>
            <CardDescription>Задачи в статусе "Завершено"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.completed}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Отменено</CardTitle>
            <CardDescription>Задачи в статусе "Отменено"</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{taskCounts.canceled}</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Analytics;
