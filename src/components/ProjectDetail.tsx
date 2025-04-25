import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project, User, Task } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getUsers, getEnhancedTasks } from '@/lib/api-utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/UserAvatar';
import { CalendarIcon, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectDetailProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetail({ project, open, onOpenChange }: ProjectDetailProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch users and tasks
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(token),
    enabled: !!token && !!project
  });
  
  const { data: tasks = [] } = useQuery({
    queryKey: ['enhanced-tasks'],
    queryFn: () => getEnhancedTasks(token),
    enabled: !!token && !!project
  });
  
  // Check if user can edit this project
  const canEditProject = () => {
    if (!project || !user) return false;
    return user.role === 'admin' || project.createdBy === user.id;
  };
  
  // Get assigned users
  const getAssignedUsers = () => {
    if (!project || !project.assignedUserIds) return [];
    
    return project.assignedUserIds
      .map(id => users.find(user => user.id === id))
      .filter(Boolean) as User[];
  };
  
  // Get project tasks
  const getProjectTasks = () => {
    if (!project) return [];
    
    return tasks.filter(task => task.projectId === project.id);
  };
  
  // Calculate task statistics
  const getTaskStatistics = () => {
    const projectTasks = getProjectTasks();
    
    return {
      total: projectTasks.length,
      completed: projectTasks.filter(task => task.status === 'completed').length,
      inProgress: projectTasks.filter(task => task.status === 'in-progress').length,
      overdue: projectTasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < new Date() && task.status !== 'completed';
      }).length
    };
  };
  
  if (!project) return null;
  
  const assignedUsers = getAssignedUsers();
  const projectTasks = getProjectTasks();
  const taskStats = getTaskStatistics();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="project-detail-description">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">{project?.name}</DialogTitle>
            {canEditProject() && (
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Редактировать
              </Button>
            )}
          </div>
          <p id="project-detail-description" className="text-sm text-muted-foreground mt-1">
            {project.description}
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="team">Команда</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Информация о проекте</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Начало: {project.startDate && format(new Date(project.startDate), "dd MMMM yyyy", { locale: ru })}
                    </span>
                  </div>
                  
                  {project.endDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Окончание: {format(new Date(project.endDate), "dd MMMM yyyy", { locale: ru })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      project.status === 'active' ? 'default' :
                      project.status === 'completed' ? 'secondary' :
                      'outline'
                    }>
                      {project.status === 'active' ? 'Активный' :
                      project.status === 'completed' ? 'Завершен' :
                      'На паузе'}
                    </Badge>
                  </div>
                  
                  {project.client && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Клиент:</span>
                      <Badge variant="outline" className="ml-2">
                        {project.client.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Статистика задач</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Card className="border-none shadow-none">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Всего задач</p>
                          <p className="text-lg font-bold">{taskStats.total}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-none">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Завершено</p>
                          <p className="text-lg font-bold">{taskStats.completed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-none">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">В процессе</p>
                          <p className="text-lg font-bold">{taskStats.inProgress}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-none shadow-none">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 p-2 rounded-full">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Просрочено</p>
                          <p className="text-lg font-bold">{taskStats.overdue}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Команда проекта</h3>
            {assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {assignedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 border rounded-md">
                    <UserAvatar user={user} />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Нет назначенных пользователей</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4">
            <h3 className="text-sm font-medium mb-2">Задачи проекта</h3>
            {projectTasks.length > 0 ? (
              <div className="space-y-2">
                {projectTasks.map(task => (
                  <div key={task.id} className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                      <Badge variant={
                        task.status === 'completed' ? 'secondary' :
                        task.status === 'in-progress' ? 'default' :
                        task.status === 'under-review' ? 'outline' :
                        task.status === 'canceled' ? 'destructive' :
                        'outline'
                      }>
                        {task.status === 'draft' ? 'Черновик' :
                         task.status === 'in-progress' ? 'В процессе' :
                         task.status === 'under-review' ? 'На проверке' :
                         task.status === 'completed' ? 'Завершено' :
                         'Отменено'}
                      </Badge>
                    </div>
                    
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(new Date(task.dueDate), "dd.MM.yyyy")}</span>
                        
                        {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                          <Badge variant="destructive" className="text-xs ml-2">Просрочено</Badge>
                        )}
                      </div>
                    )}
                    
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map(assignee => (
                            <UserAvatar key={assignee.id} user={assignee} size="sm" />
                          ))}
                          
                          {task.assignees.length > 3 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs">
                              +{task.assignees.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Нет задач в этом проекте</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
